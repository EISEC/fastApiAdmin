import mysql.connector
from mysql.connector import Error

try:
    connection = mysql.connector.connect(
        host='eisec.beget.tech',
        database='eisec_fastapi',
        user='eisec_fastapi',
        password='yaUKdfr!ZQ0y',
        auth_plugin='mysql_native_password'
    )
    
    if connection.is_connected():
        db_info = connection.get_server_info()
        print(f"Подключено к MySQL Server версии {db_info}")
        cursor = connection.cursor()
        cursor.execute("select database();")
        record = cursor.fetchone()
        print(f"Подключено к базе данных: {record[0]}")

except Error as e:
    print(f"Ошибка при подключении к MySQL: {e}")

finally:
    if 'connection' in locals() and connection.is_connected():
        cursor.close()
        connection.close()
        print("Соединение с MySQL закрыто") 