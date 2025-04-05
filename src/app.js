const express = require("express");
const mongoose = require("mongoose");
const Order = require("./models/order");
const amqp = require("amqplib");
const config = require("./config");
const startMetricsServer = require("./metrics");
const logger = require('./logger')
const axios = require("axios")

class App {
  constructor() {
    this.app = express();
    this.connectDB();
    this.setupOrderConsumer();
  }

  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
    logger.error("service order disconnected from db")
  }

  async setupOrderConsumer() {
    console.log("Connecting to RabbitMQ...");
  
    setTimeout(async () => {
      try {
        const amqpServer = "amqp://127.0.0.1:5672";
        const connection = await amqp.connect(amqpServer);
        console.log("Service Order connected to RabbitMQ");
        const channel = await connection.createChannel();
        await channel.assertQueue("orders");
        
        
        channel.consume("orders", async (data) => {
          // Consume messages from the order queue on buy
          console.log("Consuming ORDER service");
          let response = await axios.get(`http://localhost:4000/variable`);
          if (response.data.value == 8) {
            await axios.post(`http://localhost:4000/variable/increment`);
            console.log("Preventing E8")
            return
          }
          logger.info("ORDER SERVICE - order consumed from queue orders in service order. <E8>")
          const { products, username, orderId } = JSON.parse(data.content);
  
          const newOrder = new Order({
            products,
            user: username,
            totalPrice: products.reduce((acc, product) => acc + product.price, 0),
          });
          if (response.data.value == 9) {
            await axios.post(`http://localhost:4000/variable/increment`);
            console.log("Preventing E9")
            return
          }
          logger.info("ORDER SERVICE - service order created new order. <E9>")
  
          // Save order to DB
          
          await newOrder.save();
          if (response.data.value == 10) {
            await axios.post(`http://localhost:4000/variable/increment`);
            console.log("Preventing E10")
            return
          }
          logger.info("ORDER SERVICE - service order stored new order to db. <E10>")
          // Send ACK to ORDER service
          channel.ack(data);
          console.log("Order service: Order saved to DB and ACK sent to ORDER queue");
  
          // Send fulfilled order to PRODUCTS service
          // Include orderId in the message
          const { user, products: savedProducts, totalPrice } = newOrder.toJSON();
          if (response.data.value == 11) {
            await axios.post(`http://localhost:4000/variable/increment`);
            console.log("Preventing E11")
            return
          }
          logger.info("ORDER SERVICE - service order publishing new order to products queue. <E11>")
          channel.sendToQueue(
            "products",
            Buffer.from(JSON.stringify({ orderId, user, products: savedProducts, totalPrice }))
          );
          if (response.data.value == 12) {
            await axios.post(`http://localhost:4000/variable/increment`);
            console.log("Preventing E12")
            return
          }
          logger.info("RABBITMQ - received new order in queue products. <E12>")
        });
      } catch (err) {
        logger.error("Failed to connect to RabbitMQ:" + err.message)
        console.error("Failed to connect to RabbitMQ:", err.message);
      }
    }, 10000); // add a delay to wait for RabbitMQ to start in docker-compose
  }



  start() {
    this.server = this.app.listen(config.port, () => {
      console.log(`Server started on port ${config.port}`)
    }
    );
    startMetricsServer()
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log("Server stopped");
    logger.error("service product disconnected from db")
  }
}

module.exports = App;
