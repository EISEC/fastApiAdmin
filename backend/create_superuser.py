from app.db.session import SessionLocal
from app.crud.admin import create
from app.schemas.admin import AdminCreate

def create_superuser():
    db = SessionLocal()
    try:
        superuser = AdminCreate(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
        create(db, obj_in=superuser)
        print("Суперпользователь успешно создан!")
    except Exception as e:
        print(f"Ошибка при создании суперпользователя: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser() 