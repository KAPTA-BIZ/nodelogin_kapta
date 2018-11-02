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
                if (code.used == 0) {
                    code.used = 1;
                    code.save(err => { if (err) { res.sendStatus(502); } })

                    UserSchema.findOne({ 'local.email': code.user_email }, 'sa', (err, user) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            if (user.sa == 2) {
                                Assignments.findByIdAndUpdate(code.assignment_id, { $inc: { 'codes_used': 1, 'codes_created': -1 } }, (err, doc) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    }
                                });
                            } else {
                                Assignments.findOneAndUpdate({ '_id': code.assignment_id, 'users.email': code.user_email }, { $inc: { 'users.$.codes_used': 1, 'users.$.codes_created': -1 } }, (err, doc) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    }
                                });
                            }
                        }
                    });
                    var linkResult = new LinkResults({
                        test_name: result.test.test_name,
                        percentage: result.result.percentage,
                        points_scored: result.result.points_scored,
                        points_available: result.result.points_available,
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
                        linkResult.category_results.push({
                            name: category.name,
                            percentage: category.percentage,
                            points_available: category.points_available,
                            points_scored: category.points_scored
                        });
                    });

                    result.questions.forEach(question => {
                        linkResult.questions.push({
                            question_type: question.question_type,
                            category: categories[question.category_id],
                            question: question.question,
                            options: question.options,
                            correct_option: question.correct_option,
                            user_response: question.user_response,
                            result: question.result,
                            points_available: question.points_available,
                            points_scored: question.points_scored
                        });
                    });
                    linkResult.save(function(err, testAdded) {
                        if (err) { res.sendStatus(502); }
                        UpdateSummary(code.assignment_id, code.user_email);
                    })
                }
            }
        }
    });
}

module.exports = storeLinkResult;