# Group-4-Python-Project
# Study Habit Tracker

A web app that helps students develop effective study habits by tracking study sessions, managing tasks, logging emotions, and motivating learning through gamification.


## 1. Giới thiệu dự án

**Study Habit Tracker** là ứng dụng web hỗ trợ sinh viên quản lý thời gian học tập hiệu quả.  
Người dùng có thể:
- Bấm giờ học và theo dõi hiệu suất mỗi ngày  
- Tạo danh sách việc cần làm (to-do-list) và nhận email nhắc deadline  
- Xem biểu đồ học tập và cảm xúc theo ngày/tuần/tháng  
- Tích điểm để mua nhân vật ảo (gamification)  
- Ghi lại cảm xúc sau mỗi buổi học để tự đánh giá tiến bộ
- Được đề xuất lộ trình học khi sắp đến kì thi (Machine Learning)

## 2. Thành viên tham gia

| Tên | MSV | App phụ trách chính | Đóng góp |
|------|-------|-------------------|-----------|
| **Nguyễn Phương Ngân** | 11245914 | study | 100% |
| Đỗ Phạm Hà Chi | 11245851 | accounts | 100% |
| Lê Thùy Dương | 11245864 | emotion | 100% |
| Trần Khánh Linh | 11245897 | todo | 100% |
| Chu Bá Thông | 11245935 | visualization | 100% |
| Đinh Nguyễn Anh Thư | 11245936 | gamification | 100% |


## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|-------------|-----------|
| **Ngôn ngữ chính** | Python 3.13 |
| **Framework web** | Django 5.x |
| **Database (dev)** | SQLite3 (PostgreSQL khi deploy) |
| **Frontend** | HTML, CSS (Tailwind), JavaScript |
| **Thư viện hỗ trợ** | matplotlib, pandas, scikit-learn |
| **Phiên bản Git** | Git + GitHub |
| **Môi trường** | Virtualenv (.venv) |


## 4. Hướng dẫn cài đặt 

### Bước 1: Clone repo
```bash
git clone https://github.com/phngan23/Group-4-Python-Project.git
cd Group-4-Python-Project
```
### Bước 2: Tạo và kích hoạt môi trường ảo (chạy từng lệnh)
Window:
```bash
python -m venv .venv
.venv\Scripts\activate
```
nếu bị lỗi, chạy các lệnh sau:
```bash
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.venv\Scripts\activate
```
Mac:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
### Bước 3: Cài đặt thư viện
```bash
pip install -r requirements.txt
```
### Bước 4: Tạo database và migrate
```bash
python manage.py migrate
```
### Bước 5: Seed data (nhân vật, shop…)
```bash
python manage.py seed_characters
```
### Bước 6: Chạy server
```bash
python manage.py runserver
```
### Bước 6: Truy cập http://127.0.0.1:8000/

