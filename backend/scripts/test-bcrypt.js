const bcrypt = require('bcryptjs');

bcrypt.compare('admin123', '$2a$10$HfUzy9uUiGwP1z2ZzU5I8eF7gRlN8c/1JElZd/UcQDOY4xjSwB2Gu')
  .then((result) => console.log("¿Es válida?", result));
