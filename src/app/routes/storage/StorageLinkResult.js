var LinkResults = require('../../models/LinkResults');
var Codes = require('../../models/Codes');
var Assignments = require('../../models/Assignments');
var UserSchema = require('../../models/user.js');
var UpdateSummary = require('./UpdateSummary');

function storeLinkResult(result) {
    Codes.findOne({ 'code': result.result.access_code_used }, null, (err, code) => {
        if (err) {
            res.sendStatus(502);
        } else {
            if (code) {
                if (code.assignment_id == 0) {
                    Assignments.findOne({ 'test_id': result.test.test_id, 'dealers.dealer': code.dealer }, null, (err, assignment) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            code.assignment_id = assignment._id;
                            code.save(err => { if (err) { res.sendStatus(502); } });
                        }
                    });
                    //////////////////////////////////////////////////////////////////////
                    var linkResult = new LinkResults({
                        test_name: result.test.test_name,
                        percentage: result.result.percentage,
                        points_scored: result.result.points_scored,
                        points_available: result.result.points_available,
                        knowledge_test_average: 0,
                        knowledge_points_scored: 0,
                        knowledge_points_available: 0,
                        time_started: result.result.time_started,
                        time_finished: result.result.time_finished,
                        duration: result.result.duration,
                        percentage_passmark: result.result.percentage_passmark,
                        passed: result.result.passed,
                        access_code_used: result.result.access_code_used
                    });
                    var categories = {}
                    result.category_results.forEach(category => {
                        categories[category.category_id] = category.name;
                        if (category.category_id > 83 && category.category_id < 91) {
                            linkResult.knowledge_points_scored += category.points_scored;
                            linkResult.knowledge_points_available += category.points_available;
                        }
                        linkResult.category_results.push({
                            id: category.category_id,
                            name: category.name,
                            percentage: category.percentage,
                            points_available: category.points_available,
                            points_scored: category.points_scored
                        });
                    });

                    result.questions.forEach(question => {
                        linkResult.questions.push({
                            question_id: question.question_id,
                            question_type: question.question_type,
                            category: categories[question.category_id],
                            category_id: question.category_id,
                            question: question.question,
                            options: question.options,
                            correct_option: question.correct_option,
                            user_response: question.user_response,
                            result: question.result,
                            points_available: question.points_available,
                            points_scored: question.points_scored
                        });
                    });
                    linkResult.knowledge_test_average = (linkResult.knowledge_points_scored * 100 / linkResult.knowledge_points_available).toFixed(2);
                    linkResult.save(function (err, testAdded) {
                        if (err) { res.sendStatus(502); }
                        UpdateSummary(code.assignment_id);
                    })
                    /////////////////////////////////////////////////
                }
            }
        }
    });
}

module.exports = storeLinkResult;