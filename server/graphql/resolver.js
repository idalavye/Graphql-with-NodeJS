const bcrypt = require("bcryptjs");

const User = require("../models/user");

module.exports = {
  createUser: async function({ userInput }, req) {
    // const email = args.userInput.email;
    /**
     * async await kullanmadığımız zaman mutlaka return kullanmalıyız. Çünkü graphql promisedaki resolve u beklemez.
     * async await de is otomatik olarak await ile beklediği için return kullanmamız zorunlu değil.
     */

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      throw new Error("User exist already");
    }

    const hashedPw = bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      password: hashedPw,
      name: userInput.name
    });

    const createdUser = user.save();
    /**
     * ._doc ile mongoose un model ile bize sunmuş olduğu metadataları(metotları) istemedşğimizi sadece user ın fieldlerını
     * getirmesini istediğimizi belirtiyoruz.
     * _id yi daha sonradan tekrar dahil etmemizin sebebi ise _id yi string türüne çevirmek istediğimiz içindir. Çünkü graphql de
     * object id kullanmamız hatalara neden olacaktır.
     */
    return {
      ...createdUser._doc,
      _id: createdUser._id.toString()
    };
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
