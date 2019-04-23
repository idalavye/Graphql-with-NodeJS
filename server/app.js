const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const graphqlHttp = require("express-graphql");

const schema = require("./graphql/schema");
const resolver = require("./graphql/resolver");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  /**
   * Client post, put , delete isteklerinden önce birde option isteği atar. Ama grapql kullandığımız zaman
   * server bu option isteğine karşılık vermez ve client bu methodun olmadığını sanar. Bu yüzden option isteği
   * attığı zaman geriye 200 status code u return ediyoruz.
   */
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.send();
  }
  next();
});

/**
 * Grapql kullanabilmek için sadece post kullanmamız yeterli ama biz graphiql arayüzünü kullanmak istiyorsak get isteklerini
 * de karşılamalıyız. Bu yüzden use kullandık.
 */
app.use(
  "/graphql",
  graphqlHttp({
    schema: schema,
    rootValue: resolver,
    graphiql: true,
    formatError(err) {
      /**
       * Original Error graphql içerisinde gelen bir değerdir. Kod içerisinde oluşan hatalar original error dur.
       * Request body sinden gelen isteklerde yazım yanlışı varsa bunlar original error sayılmaz. Bu durumda return
       * err diyerek grapql in kendi error response unu geri döndürüyoruz. Aksi takdirde kendi error mesajımızı
       * return edicez.
       */
      if (!err.originalError) {
        return err;
      }

      return err;
      const data = err.originalError.data;
      const message = err.message || "An error occurred";
      const code = err.originalError.code || 500;

      return { message: message, data: data, code: code };
    }
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect("mongodb://localhost:27017/shopapp")
  .then(result => {
    app.listen(8080);
  })
  .catch(err => console.log(err));
