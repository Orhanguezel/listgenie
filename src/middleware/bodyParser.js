import bodyParser from "body-parser";

const bodyParserMiddleware = [
  bodyParser.json({ limit: "50mb" }), // ✅ JSON istekleri için 50MB limit
  bodyParser.urlencoded({ limit: "50mb", extended: true }), // ✅ Form verileri için 50MB limit
];

export default bodyParserMiddleware;
