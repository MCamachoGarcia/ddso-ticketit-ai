// Variables de entorno de los tests: un secreto fijo solo para firmar tokens de prueba (no es el del .env)
process.env.JWT_SECRET = "secreto-de-los-tests-con-mas-de-32-caracteres";
process.env.JWT_EXPIRES_IN = "2h";
