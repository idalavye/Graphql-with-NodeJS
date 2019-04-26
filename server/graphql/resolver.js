const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

module.exports = {
  createUser: async function({ userInput }, req) {
    // const email = args.userInput.email;
    /**
     * async await kullanmadığımız zaman mutlaka return kullanmalıyız. Çünkü graphql promisedaki resolve u beklemez.
     * async await de is otomatik olarak await ile beklediği için return kullanmamız zorunlu değil.
     */

    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid" });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid Input ");
      error.data = errors;
      error.code = "422";
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      throw new Error("User exist already");
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      password: hashedPw,
      name: userInput.name
    });

    const createdUser = await user.save();
    /**
     * ._doc ile mongoose un model ile bize sunmuş olduğu metadataları(metotları) istemedşğimizi sadece user ın fieldlerını
     * getirmesini istediğimizi belirtiyoruz.
     * _id yi daha sonradan tekrar dahil etmemizin sebebi ise _id yi string türüne çevirmek istediğimiz içindir. Çünkü graphql de
     * object id kullanmamız hatalara neden olacaktırc.
     */
    return {
      ...createdUser._doc,
      _id: createdUser._id.toString()
    };
  },

  login: async function({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found");
      error.code = 401;
      throw error;
    }
    const isEqual = bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is incorrect");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      "somesupersecretsecret",
      { expiresIn: "1h" }
    );

    return { token: token, userId: user._id.toString() };
  }
};

/**
 * İlk Örnek
 */

// module.exports = {
//   hello() {
//     return {
//       text: "Hello World",
//       views: 233
//     };
//   }
// };
