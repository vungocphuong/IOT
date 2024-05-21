/*
Welcome to JP Learning
*/
const express = require('express');
const mqtt = require('mqtt');
const shortId = require('shortid');
const mongoose = require('mongoose');
const moment = require('moment'); //thao tác và hiển thị ngày giờ
const cors = require('cors');

const app = express(); //tạo một ứng dụng web mới sử dụng Express
const port = 8080;
app.use(express.json());  //cho phép ứng dụng của bạn xử lý các yêu cầu JSON. Điều này có nghĩa là bạn có thể gửi dữ liệu JSON đến ứng dụng của bạn và ứng dụng của bạn sẽ có thể đọc dữ liệu đó

// Enable cors on all requests.
app.use(cors());
app.options('*', cors());

const server = require('http').createServer(app);  //tạo một máy chủ HTTP mới sử dụng ứng dụng Express. Máy chủ HTTP này sẽ lắng nghe các yêu cầu HTTP đến và xử lý chúng bằng ứng dụng Express
const io = require('socket.io')(server, {   //tạo một máy chủ Socket.io mới sử dụng máy chủ HTTP hiện tại. Máy chủ Socket.io này sẽ cho phép các ứng dụng web giao tiếp với nhau theo thời gian thực.
    cors: {
        origin: '*'
    }
});

// Import Models
const Users = require('./models/usersModel');
const Events = require('./models/eventsModel');

const topic_mqtt_receive = 'JPLearning_SensorData'; //Chủ đề MQTT mà ứng dụng sẽ đăng ký để nhận dữ liệu từ các thiết bị cảm biến.
const topic_mqtt_send = 'JPLearning_CommandRequest'; //Chủ đề MQTT mà ứng dụng sẽ sử dụng để gửi các lệnh đến các thiết bị cảm biến
const topic_ws_receive = 'JPLearning_CommandRequest'; //Chủ đề WebSocket mà ứng dụng sẽ đăng ký để nhận dữ liệu từ các ứng dụng web khác
const topic_ws_send = 'JPLearning_SensorData'; //Chủ đề WebSocket mà ứng dụng sẽ sử dụng để gửi dữ liệu đến các ứng dụng web khác

// HTTP POST Method
app.post('/users', async (req, res) => {
    console.log('POST Request');

    // res.send('Got a POST request')

    let user = req.body;
    console.log('body:', user)

    user = new Users(user);
    console.log('user1:', user)

    user = await user.save();
    console.log('user:', user)

    return res.status(201).json(user);
})

// HTTP GET Method
app.get('/users', async (req, res) => {
    console.log('GET Request');

    // res.send('Assalam-o-Alaikum Hello World! Welcome to JP Learning :)')

    let users = await Users.find({});

    console.log('users:', users)

    return res.status(200).json(users);
})

// HTTP GET by ID Method
app.get('/users/:id', async (req, res) => {
    console.log('GET Request');

    // res.send('Assalam-o-Alaikum Hello World! Welcome to JP Learning :)')

    console.log('id:', req.params.id)
    // let user = await Users.findById(req.params.id);
    let user = await Users.findOne({ _id: req.params.id });

    console.log('user:', user)

    return res.status(200).json(user);
})

// HTTP PUT Method
app.put('/users/:id', async (req, res) => {
    console.log('PUT Request');

    // res.send('Got a PUT request at / device')

    console.log('id:', req.params.id)
    console.log('body:', req.body)

    // let user = await Users.findByIdAndUpdate(req.params.id, req.body);
    let user = await Users.findOneAndUpdate({ _id: req.params.id }, req.body);

    user = await Users.findById(req.params.id);

    console.log('user:', user);

    return res.status(200).json(user);
})

// HTTP DELETE Method
app.delete('/users/:id', async (req, res) => {
    console.log('DELETE Request');

    // res.send('Got a DELETE request at /device')

    console.log('id:', req.params.id)

    // let user = await Users.findByIdAndDelete(req.params.id);
    // let user = await Users.findByIdAndRemove(req.params.id);

    // let user = await Users.findOneAndDelete({ _id: req.params.id });
    let user = await Users.findOneAndRemove({ _id: req.params.id });

    console.log('user:', user);

    return res.status(200).json(user);
})

// HTTP GET last events of all devices
app.get('/events', async (req, res) => {
    console.log('GET Request for Events');

    let events = []; //tạo một mảng để lưu trữ danh sách các sự kiện sẽ được trả về cho người dùng

    // let eventTemperature = await Events.findOne({ type: 'Temperature' }).sort({ created: -1 }).limit(1);
    //iểm tra xem sự kiện nhiệt độ cuối cùng có tồn tại hay không. Nếu tồn tại, sự kiện này sẽ được thêm vào mảng events
    let eventTemperature = await Events.findOne({ type: 'Temperature' }).sort({ created: -1 });
    if (eventTemperature) {
        events.push(eventTemperature);
    }

    //tìm kiếm và thêm sự kiện độ ẩm cuối cùng vào mảng events
    let eventHumidity = await Events.findOne({ type: 'Humidity' }).sort({ created: -1 });
    if (eventHumidity) {
        events.push(eventHumidity);
    }

    //tìm kiếm và thêm sự kiện ánh sáng cuối cùng vào mảng events
    let eventLight = await Events.findOne({ type: 'Light' }).sort({ created: -1 });
    if (eventLight) {
        events.push(eventLight);
    }

    console.log('events:', events)

    return res.status(200).json(events);
})

// HTTP GET by DeviceId and Type Method -- -- trả về danh sách các sự kiện của thiết bị có ID deviceId và loại type
app.get('/events/deviceId/:deviceId/type/:type', async (req, res) => {
    console.log('GET Request for Events');

    console.log('deviceId:', req.params.deviceId) //in ra ID thiet bi
    console.log('type:', req.params.type)  // in ra loai 
    let events = await Events.find({ device_id: req.params.deviceId, type: req.params.type });

    console.log('events:', events)

    return res.status(200).json(events);
})

// HTTP GET last event by DeviceId and Type Method  -- trả về sự kiện cuối cùng của thiết bị có ID deviceId và loại type
app.get('/events/last/deviceId/:deviceId/type/:type', async (req, res) => {
    console.log('GET Request for Last Events');

    console.log('deviceId:', req.params.deviceId) 
    console.log('type:', req.params.type)  
    // let eventTemperature = await Events.findOne({ device_id: req.params.deviceId, type: req.params.type }).sort({ created: -1 }).limit(1);
    let event = await Events.findOne({ device_id: req.params.deviceId, type: req.params.type }).sort({ created: -1 });

    console.log('event:', event)

    return res.status(200).json(event);
})

// MongoDB Connection Success
mongoose.connection.on('connected', async () => {
    console.log('MongoDb connected');
});

// MongoDB Connection Fail
mongoose.connection.on('error', async (err) => {
    console.log('Error connecting MongoDb', err);
});

//Khởi động máy chủ HTTP trên cổng port, Kết nối với cơ sở dữ liệu MongoDB, 
server.listen(port, async () => {
    // Connect MongoDb
    await mongoose.connect('mongodb+srv://vuphuong2002vnp:KPXgFqyDX97NZZn5@cluster0.hbx7g3l.mongodb.net/Practice?retryWrites=true&w=majority');

    console.log(`Example app listening on port ${port}`)
})

// WebSocket(Socket.IO)

io.on('connection', async (client) => {  //lắng nghe các kết nối WebSocket mới
    console.log('Client Connected');
    console.log(client.id);

    client.on(topic_ws_receive, async (data) => {
        console.log('[WS Received] Data:', data);
        console.log('[WS Received] Data.device_id:', data.device_id);

        // Gửi lệnh tới thiết bị
        await sendToDevice(topic_mqtt_send, data);
    })
});

// setInterval(async () => {
//     await sendToApplicaiton('time', new Date().toTimeString());
// }, 1000);

//gửi dữ liệu đến các ứng dụng được kết nối với ứng dụng Socket.IO hiện tại
sendToApplicaiton = async (topic, msg) => {
    console.log('\n[WS Sending] data to Applications message:', msg)
    await io.emit(topic, msg);
}

// MQTT(HiveMQ)

const client = mqtt.connect('mqtt://broker.hivemq.com:1883');
client.on('connect', async () => {
    console.log('MQTT Connected');

    await client.subscribe(topic_mqtt_receive);
})

client.on('message', async (topic, message) => {  // lắng nghe các sự kiện
    console.log('\n[MQTT Received] Topic:', topic, ', Message:', message.toString());

    // let data = message;
    let data = message.toString();
    data = JSON.parse(data);
    data._id = shortId.generate();
    data.created = moment().utc().add(5, 'hours');

    // Save live data into database
    await saveData(data);//lưu về csdl
})

//lưu về csdl
saveData = async (data) => {
    data = new Events(data);
    data = await data.save();
    console.log('Saved data:', data);

    // Send live data to applications
    await sendToApplicaiton(topic_ws_send, data);
}

sendToDevice = async (topic, message) => {
    console.log('\n[MQTT Sending] data to Device message:', message)

    let data = JSON.stringify(message);
    // data = JSON.parse(data);
    await client.publish(topic, data);
}