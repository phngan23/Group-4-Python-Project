# Group-4-Python-Project
# Study Habit Tracker

A web app that helps students develop effective study habits by tracking study sessions, managing tasks, logging emotions, and motivating learning through gamification.


## 1. Giới thiệu dự án

**Study Habit Tracker** là ứng dụng web hỗ trợ sinh viên quản lý thời gian học tập hiệu quả.  
Người dùng có thể:
- Bấm giờ học và theo dõi hiệu suất mỗi ngày  
- Tạo danh sách việc cần làm (to-do-list) và nhận email nhắc deadline  
- Xem biểu đồ học tập và cảm xúc theo ngày/tuần/tháng  
- Tích điểm để trồng cây ảo (gamification)  
- Ghi lại cảm xúc sau mỗi buổi học để tự đánh giá tiến bộ  


## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|-------------|-----------|
| **Ngôn ngữ chính** | Python 3.13 |
| **Framework web** | Django 5.x |
| **Database (dev)** | SQLite3 (PostgreSQL khi deploy) |
| **Frontend** | HTML, CSS (Tailwind), JavaScript |
| **Thư viện hỗ trợ** | matplotlib, pandas, scikit-learn |
| **Phiên bản Git** | Git + GitHub |
| **Môi trường** | Virtualenv (.venv) |


## 3. Hướng dẫn cài đặt 

### Bước 1: Clone repo
```bash
git clone https://github.com/phngan23/Group-4-Python-Project.git
cd Group-4-Python-Project

### Bước 2: Tạo và kích hoạt môi trường ảo
Window:

python -m venv .venv

.venv\Scripts\activate

Mac:

python3 -m venv .venv

source .venv/bin/activate

### Bước 3: Cài đặt thư viện
pip install -r requirements.txt

### Bước 4: Tạo database và migrate
python manage.py migrate

### Bước 5: Chạy server
python manage.py runserver
