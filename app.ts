import path from "path";
import express from "express";
const app: express.Application = express();

app.use('/public', express.static(path.join(__dirname, "/public")));
app.get('/ws', (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(__dirname, "/public/ws/ws.html"));
});

app.listen((process.env.PORT || process.argv[2]) || 80, () => console.log(`Running on Port ${(process.env.PORT || process.argv[2]) || 80}`))