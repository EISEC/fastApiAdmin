from fastapi import FastAPI, Depends, HTTPException, Request, Form, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.crud.admin import authenticate, get
from app.core.security import create_access_token
from datetime import timedelta
from jose import jwt, JWTError
from app.crud.crud_user import get_multi, user as crud_user
from app.crud.crud_role import role as crud_role
from app.schemas.user import UserCreate, UserUpdate

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Подключаем шаблоны и статику
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Подключаем роутер API
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to FastAPI Admin"}

# Базовые эндпоинты для админ-панели
@app.get("/admin", response_class=HTMLResponse)
def admin_panel(request: Request, access_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    return templates.TemplateResponse("admin/index.html", {"request": request, "admin": admin})

@app.get("/admin/login", response_class=HTMLResponse)
def admin_login_page(request: Request):
    return templates.TemplateResponse("admin/login.html", {"request": request})

@app.post("/admin/login")
def admin_login(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    admin = authenticate(db, username=username, password=password)
    if not admin:
        return templates.TemplateResponse("admin/login.html", {"request": request, "error": "Неверное имя пользователя или пароль"})
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(admin.id, expires_delta=access_token_expires)
    response = RedirectResponse(url="/admin", status_code=303)
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
    return response

@app.get("/admin/users", response_class=HTMLResponse)
def admin_users(request: Request, access_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    users = get_multi(db)
    return templates.TemplateResponse("admin/users.html", {"request": request, "users": users})

@app.get("/admin/users/create", response_class=HTMLResponse)
def create_user_page(request: Request, access_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    roles = crud_role.get_multi(db)
    return templates.TemplateResponse("admin/user_edit.html", {"request": request, "roles": roles})

@app.post("/admin/users/create")
def create_user(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role_id: int = Form(...),
    is_active: bool = Form(False),
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    
    user_in = UserCreate(
        username=username,
        email=email,
        password=password,
        role_id=role_id,
        is_active=is_active
    )
    crud_user.create(db, obj_in=user_in)
    return RedirectResponse(url="/admin/users", status_code=303)

@app.get("/admin/users/{user_id}/edit", response_class=HTMLResponse)
def edit_user_page(
    request: Request,
    user_id: int,
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    
    user = crud_user.get(db, id=user_id)
    if not user:
        return RedirectResponse(url="/admin/users", status_code=303)
    roles = crud_role.get_multi(db)
    return templates.TemplateResponse(
        "admin/user_edit.html",
        {"request": request, "user": user, "roles": roles}
    )

@app.post("/admin/users/{user_id}/edit")
def edit_user(
    request: Request,
    user_id: int,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(None),
    role_id: int = Form(...),
    is_active: bool = Form(False),
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    
    user = crud_user.get(db, id=user_id)
    if not user:
        return RedirectResponse(url="/admin/users", status_code=303)
    
    user_in = UserUpdate(
        username=username,
        email=email,
        password=password,
        role_id=role_id,
        is_active=is_active
    )
    crud_user.update(db, db_obj=user, obj_in=user_in)
    return RedirectResponse(url="/admin/users", status_code=303)

@app.get("/admin/users/{user_id}/delete")
def delete_user(
    request: Request,
    user_id: int,
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        return RedirectResponse(url="/admin/login", status_code=303)
    try:
        payload = jwt.decode(access_token.split(" ")[1], settings.SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        if not admin_id:
            return RedirectResponse(url="/admin/login", status_code=303)
        admin = get(db, id=int(admin_id))
        if not admin:
            return RedirectResponse(url="/admin/login", status_code=303)
    except JWTError:
        return RedirectResponse(url="/admin/login", status_code=303)
    
    user = crud_user.get(db, id=user_id)
    if user:
        crud_user.remove(db, id=user_id)
    return RedirectResponse(url="/admin/users", status_code=303) 