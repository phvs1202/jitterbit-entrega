require('dotenv').config();
const express = require('express');
const sql = require('mssql');

const app = express();
app.use(express.json());

// 1. Configuração do Banco
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS' 
    }
};

const poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
        console.log('Conectado ao SQL Server com sucesso!');
        return pool;
    })
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    });

const mapOrderData = (input) => {
    return {
        orderId: input.numeroPedido.replace('-01', ''),
        value: input.valorTotal,
        creationDate: new Date(input.dataCriacao).toISOString(),
        items: input.items.map(item => ({
            productId: parseInt(item.idItem),
            quantity: item.quantidadeItem,
            price: item.valorItem
        }))
    };
};

// --- ENDPOINTS ---

// 1. Listar pedidos (GET)
app.get('/order/list', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM "Order"');
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: "Erro ao listar pedidos: " + error.message });
    }
});

// 2. Criar novo pedido (POST)
app.post('/order', async (req, res) => {
    try {
        const mappedOrder = mapOrderData(req.body);
        const pool = await poolPromise;

        await pool.request()
            .input('orderId', sql.VarChar, mappedOrder.orderId)
            .input('value', sql.Decimal(10,2), mappedOrder.value)
            .input('creationDate', sql.DateTime, mappedOrder.creationDate)
            .query('INSERT INTO "Order" (orderId, value, creationDate) VALUES (@orderId, @value, @creationDate)');

        for (const item of mappedOrder.items) {
            await pool.request()
                .input('orderId', sql.VarChar, mappedOrder.orderId)
                .input('productId', sql.Int, item.productId)
                .input('quantity', sql.Int, item.quantity)
                .input('price', sql.Decimal(10,2), item.price)
                .query('INSERT INTO Items (orderId, productId, quantity, price) VALUES (@orderId, @productId, @quantity, @price)');
        }

        res.status(201).json({ message: "Pedido criado com sucesso", data: mappedOrder });
    } catch (error) {
        res.status(400).json({ error: "Erro ao processar pedido: " + error.message });
    }
});

// 3. Obter pedido por ID (GET)
app.get('/order/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const orderResult = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('SELECT * FROM "Order" WHERE orderId = @id');

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        const itemsResult = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('SELECT productId, quantity, price FROM Items WHERE orderId = @id');

        const orderData = orderResult.recordset[0];
        orderData.items = itemsResult.recordset;

        res.status(200).json(orderData);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pedido: " + error.message });
    }
});

// 4. Atualizar pedido (PUT)
app.put('/order/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const check = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('SELECT orderId FROM "Order" WHERE orderId = @id');
            
        if (check.recordset.length === 0) {
            return res.status(404).json({ message: "Pedido inexistente" });
        }
        
        if(req.body.valorTotal) {
             await pool.request()
                .input('id', sql.VarChar, req.params.id)
                .input('value', sql.Decimal(10,2), req.body.valorTotal)
                .query('UPDATE "Order" SET value = @value WHERE orderId = @id');
        }

        res.status(200).json({ message: "Pedido atualizado com sucesso" });
    } catch (error) {
         res.status(500).json({ error: "Erro ao atualizar: " + error.message });
    }
});

// 5. Deletar pedido (DELETE)
app.delete('/order/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM "Order" WHERE orderId = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Pedido não encontrado para exclusão" });
        }

        res.status(200).json({ message: "Excluído com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir: " + error.message });
    }
});

// 6. Deletar item (DELETE)
app.delete('/items/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM "Items" WHERE productId = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Item não encontrado para exclusão" });
        }

        res.status(200).json({ message: "Excluído com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API conectada e rodando na porta ${PORT}`));