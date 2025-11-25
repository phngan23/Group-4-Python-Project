from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout

# Đăng ký người dùng mới
def register(request):
    if request.method == "POST": # nếu người dùng đang gửi thông tin
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirm = request.POST.get("confirm")

        # Kiểm tra mật khẩu khớp
        if password != confirm:
            messages.error(request, "Mật khẩu không khớp!")
            return redirect("register")

        # Kiểm tra username tồn tại
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username đã tồn tại!")
            return redirect("register")

        # Kiểm tra email tồn tại
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email đã tồn tại!")
            return redirect("register")

        # Tạo user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        user.save()

        messages.success(request, "Đăng ký thành công! Hãy đăng nhập.")
        return redirect("login")

    return render(request, "accounts/dangky.html")

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        # Kiểm tra username và password
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("/")  # Chuyển đến home page sau khi đăng nhập
        else:
            messages.error(request, "Sai tên đăng nhập hoặc mật khẩu!")
            return redirect("login")

    # GET request → hiển thị trang đăng nhập
    return render(request, "accounts/dangnhap.html")

def logout_view(request):
    logout(request)
    return redirect("login")
