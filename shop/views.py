from django.shortcuts import render
from rest_framework import generics, permissions, viewsets, status
from django.contrib.auth import get_user_model
from .serializers import UserRegisterSerializer, UserProfileSerializer, CategorySerializer, ProductSerializer, CartSerializer, CartItemSerializer, OrderSerializer
from .models import Category, Product, Cart, CartItem, Order, OrderItem
from rest_framework.response import Response
from rest_framework.decorators import action
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache

User = get_user_model()

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def list(self, request, *args, **kwargs):
        cached = cache.get('categories_list')
        if cached:
            return Response(cached)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        cache.set('categories_list', serializer.data, timeout=3600)
        return Response(serializer.data)

    def perform_create(self, serializer):
        result = serializer.save()
        cache.delete('categories_list')
        return result

    def perform_update(self, serializer):
        result = serializer.save()
        cache.delete('categories_list')
        return result

    def perform_destroy(self, instance):
        result = super().perform_destroy(instance)
        cache.delete('categories_list')
        return result

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def list(self, request, *args, **kwargs):
        cached = cache.get('products_list')
        if cached:
            return Response(cached)
        queryset = self.get_queryset().select_related('category')
        serializer = self.get_serializer(queryset, many=True)
        cache.set('products_list', serializer.data, timeout=3600)
        return Response(serializer.data)

    def perform_create(self, serializer):
        result = serializer.save()
        cache.delete('products_list')
        return result

    def perform_update(self, serializer):
        result = serializer.save()
        cache.delete('products_list')
        return result

    def perform_destroy(self, instance):
        result = super().perform_destroy(instance)
        cache.delete('products_list')
        return result

class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        # Get or create cart item
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        current_quantity = 0 if created else cart_item.quantity
        new_quantity = current_quantity + quantity
        max_addable = product.stock - current_quantity

        if quantity > max_addable:
            return Response({'error': f'Cannot add {quantity} units. Only {max_addable} left in stock.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = new_quantity
        cart_item.save()
        return Response({'success': f'Added {quantity} unit(s) of {product.name} to cart. Total in cart: {cart_item.quantity}'})

    @action(detail=False, methods=['post'])
    def remove(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        try:
            cart_item = CartItem.objects.get(cart=cart, product=product)
            cart_item.delete()
            return Response({'success': 'Product removed from cart'})
        except CartItem.DoesNotExist:
            return Response({'error': 'Product not in cart'}, status=status.HTTP_404_NOT_FOUND)

class OrderViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        orders = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def place(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_items = CartItem.objects.filter(cart=cart)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        total_price = 0
        order = Order.objects.create(user=request.user, total_price=0)
        for item in cart_items:
            if item.product.stock < item.quantity:
                order.delete()
                return Response({'error': f'Not enough stock for {item.product.name}'}, status=status.HTTP_400_BAD_REQUEST)
            OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity)
            item.product.stock -= item.quantity
            item.product.save()
            total_price += item.product.price * item.quantity
        order.total_price = total_price
        order.save()
        cart_items.delete()
        return Response({'success': 'Order placed', 'order_id': order.id})

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_staff:
            return Response({'error': 'Only admin can update status'}, status=status.HTTP_403_FORBIDDEN)
        status_value = request.data.get('status')
        if status_value not in dict(order._meta.get_field('status').choices):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = status_value
        order.save()
        # Send WebSocket notification
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'order_status_{order.user.id}',
            {
                'type': 'order_status_update',
                'order_id': order.id,
                'status': order.status,
            }
        )
        return Response({'success': 'Order status updated'})
