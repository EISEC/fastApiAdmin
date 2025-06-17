import secrets
import string

def generate_secret_key():
    # Используем все возможные символы для максимальной энтропии
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # Генерируем ключ длиной 100 символов
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(100))
    return secret_key

if __name__ == '__main__':
    print(generate_secret_key()) 