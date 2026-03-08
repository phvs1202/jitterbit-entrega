# 🚀 Jitterbit Order API

API desenvolvida em Node.js para integração de pedidos com SQL Server.

## 🛠️ Tecnologias
- Node.js
- Express
- MSSQL (Tedious)
- SQL Server

## 📋 Como rodar o projeto
1. Clone o repositório.
2. Rode `npm install` para instalar as dependências.
3. Configure o arquivo `.env` seguindo o modelo abaixo:
   ```env
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_SERVER=localhost
   DB_NAME=jitterbit
   PORT=3000
4. Certifique-se de que o SQL Server permite Autenticação Mista e o TCP/IP está ativo na porta 1433.
5. Execute node index.js.

## 📖 Documentação da API
A documentação detalhada com exemplos de requests e responses pode ser acessada de duas formas:
1. **Online:** [Clique aqui para ver a Documentação Web](https://documenter.getpostman.com/view/46754638/2sBXcLgHQK)
2. **Importação Manual:** Importe o arquivo `/docs/Jitterbit.postman_collection.json` no seu Postman.
