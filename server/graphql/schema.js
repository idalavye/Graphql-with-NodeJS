const { buildSchema } = require("graphql");

/** 
 * Frontend body
 {
	"query": "{ hello { text views } }"
 }
 */
module.exports = buildSchema(`

    type TestData {
        text: String!
        views: Int!
    }

    type RootQuery {
        hello: TestData!
    }

    schema {
        query: RootQuery
    }

`);
