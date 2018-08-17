var { API_KEY, API_SECRET, CURRENT_UNIX_TIMESTAMP, SIGNATURE, FINISHED_AFTER_TIMESTAMP } = require('./credentials')

var get_all_available = "https://api.classmarker.com/v1.json?api_key=" + API_KEY + "&signature=" + SIGNATURE + "&timestamp=" + CURRENT_UNIX_TIMESTAMP

var request = require('request');
var API_Test = require('../app/models/API_Test');
var testsArray = new Array;


request(get_all_available, (error, response, body) => {
    if (!error && response.statusCode === 200) {
        var cleanBody = JSON.parse(body);
        var LinksNumber = cleanBody['links'].length;
        if (LinksNumber > 0) {
            var newTest = new Object;
            newTest.test_id = cleanBody['links'][0]['link']['assigned_tests'][0]['test']['test_id'];
            newTest.test_name = cleanBody['links'][0]['link']['assigned_tests'][0]['test']['test_name'];

            var newLink = new Object;
            newLink.link_name = cleanBody['links'][0]['link']['link_name'];
            newLink.link_url_id = cleanBody['links'][0]['link']['link_url_id'];
            newLink.link_id = cleanBody['links'][0]['link']['link_id'];
            newLink.access_list_id = cleanBody['links'][0]['link']['access_list_id'];
            newTest.links = [newLink];
            testsArray.push(newTest);

            for (var j = 1; j < LinksNumber; j++) {
                var testFromJson = cleanBody['links'][j]['link']['assigned_tests'][0]['test']['test_id'];
                for (var i = 0; i < testsArray.length; i++) {
                    if (testsArray[i].test_id == testFromJson) {
                        var newLink = new Object;
                        newLink.link_name = cleanBody['links'][j]['link']['link_name'];
                        newLink.link_url_id = cleanBody['links'][j]['link']['link_url_id'];
                        newLink.link_id = cleanBody['links'][j]['link']['link_id'];
                        newLink.access_list_id = cleanBody['links'][j]['link']['access_list_id'];
                        testsArray[i].links.push(newLink);
                        i = testsArray.lengt;
                    } else if (i == testsArray.length - 1) {
                        var newTest = new Object;
                        newTest.test_id = testFromJson;
                        newTest.test_name = cleanBody['links'][j]['link']['assigned_tests'][0]['test']['test_name'];
                        var newLink = new Object;
                        newLink.link_name = cleanBody['links'][j]['link']['link_name'];
                        newLink.link_url_id = cleanBody['links'][j]['link']['link_url_id'];
                        newLink.link_id = cleanBody['links'][j]['link']['link_id'];
                        newLink.access_list_id = cleanBody['links'][j]['link']['access_list_id'];
                        newTest.links = [newLink];
                        testsArray.push(newTest);
                        i = testsArray.lengt;
                    }
                }
            }

        }

        API_Test.remove({}, (err) => {
            if (!err) { }
            updateTests(0, testsArray.length);
        })
    } else {
        //->se debe manejar este error (no se pudo actualizar)
        console.log(error);
    }

});

function updateTests(i, imax) {
    if (i < imax) {

        var newAPI_Test = new API_Test({
            test_id: testsArray[i].test_id,
            test_name: testsArray[i].test_name,
            links: testsArray[i].links
        });

        newAPI_Test.save((err) => {
            if (err) console.log(err);
            //--->se debe manejar este error al guardar datos
            updateTests(i + 1, imax)
        })

    } else {
        console.log("Actualización Termianda");
    }
}

module.exports = get_all_available;