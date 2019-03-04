var Codes = require('../../models/Codes');
var LinkResults = require('../../models/LinkResults');
var SummaryResults = require('../../models/SummaryResults');

function UpdateSummary(assignment_id) {
    if (assignment_id) {
        Codes.find({ 'assignment_id': assignment_id }, null, (err, codes_list) => {
            if (err) {
                res.sendStatus(502);
            } else {
                codes = [];
                codes_list.forEach(code => {
                    codes.push(code.code);
                });

                LinkResults.find({ 'access_code_used': { $in: codes } }, null, (err, results_list) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        average = 0;
                        knowledge_points_scored = 0;
                        knowledge_points_available = 0;
                        categories = [];
                        results_list.forEach(result => {
                            average += Number(result.percentage);
                            result.category_results.forEach(categorie => {
                                index = categories.findIndex(doc => doc.name == categorie.name);
                                if (index == -1) {
                                    categories.push({
                                        name: categorie.name,
                                        id: categorie.id,
                                        average: categorie.percentage,
                                        points_scored: categorie.points_scored,
                                        points_available: categorie.points_available
                                    });
                                } else {
                                    categories[index].average += categorie.percentage;
                                    categories[index].points_scored += categorie.points_scored;
                                    categories[index].points_available += categorie.points_available;
                                }
                                if (categorie.id > 83 && categorie.id < 91) {
                                    knowledge_points_scored += categorie.points_scored;
                                    knowledge_points_available += categorie.points_available;
                                }
                            });
                        });
                        categories.forEach(categorie => {
                            categorie.average = categorie.average / codes.length;
                        })
                        data = {
                            assignment_id: assignment_id,
                            /*  user_email: user_email, */
                            number_of_results: codes.length,
                            knowledge_test_average: (knowledge_points_scored*100/knowledge_points_available).toFixed(2),
                            knowledge_points_scored: knowledge_points_scored,
                            knowledge_points_available: knowledge_points_available,
                            categories: categories
                        };

                        SummaryResults.findOne({ 'assignment_id': assignment_id }, null, (err, summary) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                if (summary) {
                                    summary.number_of_results = data.number_of_results;
                                    summary.knowledge_test_average = data.knowledge_test_average;
                                    summary.knowledge_points_scored = data.knowledge_points_scored;
                                    summary.knowledge_points_available = data.knowledge_points_available;
                                    summary.categories = data.categories;
                                } else {
                                    var summary = new SummaryResults(data);
                                }
                                summary.save(err => {
                                    if (err) {
                                        res.sendStatus(502);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

module.exports = UpdateSummary;