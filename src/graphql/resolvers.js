module.exports = {
    Query: {
        allUsers: async(parent, args, {UserSchema}) =>{
            const res = await UserSchema.find();
            return res;
        },
        userById: async(parent,args, {UserSchema}) =>{
            const res = await UserSchema.findOne({_id: args.id});
            return res;
        },
        allTests: async(parent, args, {TestSchema}) => {
            const res = await TestSchema.find();
            return res;
        },
        testById: async(parent, args, {TestSchema}) => {
            const res = await TestSchema.findOne({_id: args.id});
            return res;
        },
        testByIdTest: async(parent, args, {TestSchema}) => {
            const res = await TestSchema.findOne({test_id: args.test_id});
            return res;
        },
        linkTestById: async(parent, args, {LinkSchema}) => {
            const res = await LinkSchema.findOne({test_id: args.test_id});
            return res;
        },
        allLinkTests: async(parent, args, {LinkSchema}) => {
            const res = await LinkSchema.find();
            return res;
        },
        allGroupTests: async(parent, args, {GroupSchema}) => {
            const res = await GroupSchema.find();
            return res;
        },
        allHooks: async(parent,args, {HookSchema}) => {
            const res = await HookSchema.find();
            return res;
        }
    },
    Mutation:{
        createUser: async (parent, args, {UserSchema}) => {
            const newUser = {
                name: args.name,
                email: args.authProvider.email.email,
                password: args.authProvider.email.password
            };
           const res = await UserSchema.create(newUser);
           return res;
        },
        signinUser: async(parent,args, {UserSchema}) =>{
            const user = await UserSchema.findOne({ email: args.email.email });
            console.log(user);
            if(args.email.password === user.password){
                return {token: `token-${user.email}`,user};
            }
        },
        addTest: async(parent,args, {TestSchema}) => {
            const newTest = {
                test_id: args.input.test_id,
                access_code:args.input.access_code,
                percentage:args.input.percentage,
                points_scored:args.input.points_scored,
                points_available:args.input.points_available,
                time_started:args.input.time_started,
                time_finished:args.input.time_finished,
                duration:args.input.duration
            };
           const res = await TestSchema.create(newTest);
           return res;
        },
        addLinkTest: async(parent,args,{LinkSchema}) => {
            const newLinkTest = {
                test_name: args.input.test_name,
                test_id: args.input.test_id
            };
            const res = await LinkSchema.create(newLinkTest);
            return res;
        },
        addGroupTest: async(parent,args,{GroupSchema}) => {
            const newGroupTest = {
                group_name: args.input.group_name,
                group_id: args.input.group_id
            };
            const res = await GroupSchema.create(newGroupTest);
            return res;
        },
        addHook: async(parent,args,{HookSchema}) => {
            const newHook = {
                category: args.input.category,
                test_id: args.input.test_id,
                access_code: args.input.access_code
            };
            const res = await HookSchema.create(newHook);
            return res;
        }
    }

};