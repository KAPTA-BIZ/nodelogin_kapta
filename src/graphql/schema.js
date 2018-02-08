var { makeExecutableSchema } = require('graphql-tools');
var resolvers = require('./resolvers')

var typeDefs = `

type Mutation{
    createUser(name: String!, authProvider: AuthProviderSignupData!): User
    signinUser(email: AUTH_PROVIDER_EMAIL): SigninPayload!
    addTest(input: TestInput): Test
    addLinkTest(input: LinkTestInput): LinkTest
    addGroupTest(input: GroupTestInput): GroupTest
    addHook(input: HookInput): Hook
}

type User{
    id:ID!
    name:String!
    email:String!
}

input AuthProviderSignupData{
    email: AUTH_PROVIDER_EMAIL
}

input AUTH_PROVIDER_EMAIL{
    email:String!
    password:String!
}

type SigninPayload{
    token:String
    user:User
}

input TestInput{
    test_id:String
    access_code:String
    percentage:Float
    points_scored:Float
    points_available:Float
    time_started:String
    time_finished:String
    duration:String
}

type Test{
    id:ID!
    test_id:String
    access_code:String
    percentage:Float
    points_scored:Float
    points_available:Float
    time_started:String
    time_finished:String
    duration:String
}

input HookInput{
    category:String
    test_id:String
    access_code:String    
}

type Hook{
    id:ID!
    category:String
    test_id:String
    access_code:String
}

input LinkTestInput{
    test_name: String
    test_id:String
}

type LinkTest{
    id:ID!
    test_name: String
    test_id:String
}

input GroupTestInput{
    group_name: String
    group_id:Float
}

type GroupTest{
    id:ID!
    group_name: String
    group_id:Float
}

type Query{
    allUsers: [User]
    userById(id: ID!): User
    allTests: [Test]
    testById(id: ID): Test
    testByIdTest(test_id: String): Test
    allLinkTests: [LinkTest]
    linkTestById(test_id: String): LinkTest
    allGroupTests: [GroupTest]
    allHooks: [Hook]
}

`;

module.exports = makeExecutableSchema({ typeDefs,resolvers });
