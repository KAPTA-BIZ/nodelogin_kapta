document.getElementById("btn_pdf_es").onclick = function () {
    current_lang = 'es';
    exportResultsPDF();
}
document.getElementById("btn_pdf_en").onclick = function () {
    current_lang = 'en';
    exportResultsPDF();
}


function exportResultsPDF() {
    var doc = new jsPDF({
        format: 'letter',
    });

    var imgData = canvas.toDataURL();
    var imgData2 = ctx.toDataURL();
    var imageData2Properties = doc.getImageProperties(imgData2);

    var Xmin = 10;
    var Xmax = 206;
    var Y = 15;
    var Ymax = 269;
    var fontSize = 16;
    var title = "BMW Service Advisor";
    var accessCodeUsed = document.getElementById("accessCodeUsed").innerHTML;
    var overallResult = document.getElementById("overallResult").innerHTML;
    var countryAverage = document.getElementById("countryAverage").innerHTML;
    var assesmentInformation = document.getElementById("assesmentInformation");
    var testDuration = assesmentInformation.rows[0].cells[2].innerHTML.trim();
    var testStartDate = assesmentInformation.rows[1].cells[2].innerHTML.trim();
    var testEndDate = assesmentInformation.rows[2].cells[2].innerHTML.trim();

    //fonts
    doc.addFileToVFS("SegoeUI_Bold.ttf", SegoeUI_Bold);
    doc.addFont("SegoeUI_Bold.ttf", "SegoeUI", "Bold");
    doc.addFileToVFS("SegoeUI_Light.ttf", SegoeUI_Light);
    doc.addFont("SegoeUI_Light.ttf", "SegoeUI", "Light");
    doc.addFileToVFS("SegoeUI_Normal.ttf", SegoeUI_Normal);
    doc.addFont("SegoeUI_Normal.ttf", "SegoeUI", "Normal");

    //title
    doc.setFont("SegoeUI", "Bold");
    doc.setFontSize(20);
    doc.text(title, (Xmin + Xmax) / 2, Y, { align: 'center' });
    Y += 10;
    doc.setFontSize(fontSize);
    doc.text((current_lang == 'es') ? 'Código de acceso:' : 'Access Code:', Xmin, Y + 6, { align: 'left' });
    doc.setFontStyle("Light");
    doc.text(accessCodeUsed, Xmin + ((current_lang == 'es') ? 50 : 35), Y + 6, { align: 'left' });
    doc.setFont("SegoeUI", "Bold");
    doc.setFontSize(13);
    doc.text((current_lang == 'es') ? 'Duración' : 'Duration', Xmin + ((current_lang == 'es') ? 100 : 120), Y);
    doc.setFontStyle("Light");
    doc.text(testDuration, Xmin + 150, Y);
    Y += 5;
    doc.setFont("SegoeUI", "Bold");
    doc.text((current_lang == 'es') ? 'Fecha de inicio' : 'Start date', Xmin + ((current_lang == 'es') ? 100 : 120), Y);
    doc.setFontStyle("Light");
    doc.text(testStartDate, Xmin + 150, Y);
    Y += 5;
    doc.setFont("SegoeUI", "Bold");
    doc.text((current_lang == 'es') ? 'Fecha de finalización' : 'End date', Xmin + ((current_lang == 'es') ? 100 : 120), Y);
    doc.setFontStyle("Light");
    doc.text(testEndDate, Xmin + 150, Y);
    Y += 15;

    //competencias
    doc.setFontSize(18);
    doc.setFontStyle("Bold");
    doc.text((current_lang == 'es') ? 'Resultados de la Prueba de Competencias' : 'Competences test results', Xmin, Y, { align: 'left' });
    Y += 5;
    Xmin += 5;

    doc.addImage(imgData, 'PNG', (Xmin + Xmax) / 2 - 100 / 2, Y, 100, 100 * 29 / 26);
    Y += 100 * 29 / 26 + 7;

    sjt_result.forEach((competence, index) => {
        if (competence.total >= 0) {
            doc.setFontSize(13);
            doc.setFontStyle("Bold");
            doc.text(index + 1 + '. ' + ((current_lang == 'es') ? competence.name_es : competence.name), Xmin, Y, { align: 'left' });
            Y += 6;
            Xmin += 7;
            switch (competence.total) {
                case '1':
                case '2':
                    competence.insufficient.forEach((item, index2) => {
                        Y = listBullet(doc, Xmin, Xmax, Y, ((current_lang == 'es') ? competence.insufficient_es[index2] : item));
                    });
                    break;
                case '3':
                case '4':
                    competence.adequate.forEach((item, index2) => {
                        Y = listBullet(doc, Xmin, Xmax, Y, ((current_lang == 'es') ? competence.adequate_es[index2] : item));
                    });
                    break;
                case '5':
                    competence.excellent.forEach((item, index2) => {
                        Y = listBullet(doc, Xmin, Xmax, Y, ((current_lang == 'es') ? competence.excellent_es[index2] : item));
                    });
                    break;
                default:
                    break;
            }
            Xmin -= 7;
            Y += 5;
        }
    });

    doc.addPage('letter', 'p');
    Xmin = 10;
    Y = 15;

    //conocimiento
    doc.setFontSize(18);
    doc.setFontStyle("Bold");
    doc.text((current_lang == 'es') ? 'Resultados de la Prueba de Conocimientos' : 'Knowledge Test Results', Xmin, Y, { align: 'left' });
    Y += 7;
    Xmin += 5;

    doc.setFontSize(13);
    doc.setFontStyle("Normal");
    doc.text((current_lang == 'es') ? 'Resultado general de la prueba de conocimientos' : 'Overall Knowledge Test Result', Xmin, Y, { align: 'left' });
    doc.setFontStyle("Bold");
    doc.text(overallResult, Xmin + 105, Y, { align: 'left' });
    doc.setFontStyle("Normal");
    Y += 5;
    doc.text((current_lang == 'es') ? 'Promedio del país' : 'Country Average', Xmin, Y, { align: 'left' });
    doc.setFontStyle("Bold");
    doc.text(countryAverage, Xmin + 105, Y, { align: 'left' });
    Y += 7;
    doc.addImage(imgData2, 'PNG', 10, Y, (Xmax - Xmin), (Xmax - Xmin) * imageData2Properties.height / imageData2Properties.width);
    Y += (Xmax - Xmin) * imageData2Properties.height / imageData2Properties.width + 6;

    doc.text((current_lang == 'es') ? 'Respuestas' : 'Answers', Xmin, Y, { align: 'left' });
    doc.setFontStyle("Light");
    doc.setFontSize(10);

    doc.addImage(correctAnswer, 'PNG', Xmin, Y + 0.8, 3, 3);
    doc.addImage(wrongAnswer, 'PNG', Xmin + 35, Y + 0.8, 3, 3);
    doc.addImage(missedAnswer, 'PNG', Xmin + 73, Y + 0.8, 3, 3);

    Y += 3.5;
    doc.text((current_lang == 'es') ? 'Respuesta correcta' : 'Correct answer', Xmin + 4, Y, { align: 'left' });
    doc.text((current_lang == 'es') ? 'Respuesta incorrecta' : 'Incorrect answer', Xmin + 35 + 4, Y, { align: 'left' });
    doc.text((current_lang == 'es') ? 'Opción correcta omitida' : 'Missed correct option', Xmin + 73 + 4, Y, { align: 'left' });

    Y += 10;
    Xmin += 3;

    var Y_counter = 13;
    var img_temp;
    var img_temp_properties;
    var question_text;
    var scale;
    sjt_questions.forEach((question, index) => {
        question_text = doc.splitTextToSize(question.question.replace(/<(.*)\/>/g, ''), Xmax - Xmin);
        Y_counter = 3 + 5 + 5 * question_text.length;
        if (question.img_id != null) {
            img_temp = document.getElementById(question.img_id);
            img_temp_properties = doc.getImageProperties(img_temp);
            scale = 0.15;
            Y_counter += img_temp_properties.height * scale + 5;
        }

        if (Y > Ymax - Y_counter) {
            doc.addPage('letter', 'p');
            Y = 15;
        }
        doc.setFontSize(11);
        doc.setFontStyle("Bold");
        if (current_lang == 'es') {
            doc.text('Pregunta ' + (index + 1) + ' de ' + sjt_questions.length, Xmin, Y, { align: 'left' });
        } else {
            doc.text('Question ' + (index + 1) + ' of ' + sjt_questions.length, Xmin, Y, { align: 'left' });
        }
        Y += 3;
        doc.setFontSize(9);
        doc.setFontStyle("Light");
        if (current_lang == 'es') {
            doc.text(question.category + '  -  Puntos: ' + question.points_scored + ' de ' + question.points_available, Xmin, Y, { align: 'left' });
        } else {
            doc.text(question.category + '  -  Points: ' + question.points_scored + ' out of ' + question.points_available, Xmin, Y, { align: 'left' });
        }
        Y += 5;
        if (question.img_id != null) {
            doc.addImage(img_temp, 'PNG', Xmin, Y, img_temp_properties.width * scale, img_temp_properties.height * scale);
            Y += img_temp_properties.height * scale + 5;
        }
        doc.setFontSize(10);
        doc.setFontStyle("Normal");
        doc.text(question_text, Xmin, Y, { align: 'left' });
        Y += 5 * (question_text.length - 1) + 5;
        Y = optionsBullet(doc, Xmin, Xmax, Y, Ymax, question.options);
    });

    doc.save(accessCodeUsed + '.pdf');
}


function listBullet(doc, Xmin, Xmax, Y, text) {
    doc.circle(Xmin, Y - 1, 0.5, 'F');
    Xmin += 2;
    doc.setFontSize(10);
    doc.setFontStyle("Normal");
    text = doc.splitTextToSize(text, Xmax - Xmin);
    doc.text(text, Xmin, Y, { align: 'justify' });
    return Y + 5 * text.length;
}

function optionsBullet(doc, Xmin, Xmax, Y, Ymax, options) {
    var itemBullet = ['A)', 'B)', 'C)', 'D)', 'E)', 'F)', 'G)', 'H)', 'I)'];

    Xmin += 2;
    var Y_counter;
    var img_temp = new Image();
    var img_temp_properties;
    var scale = 0.15;
    var optionText;
    options.forEach((option, index) => {
        Y_counter = 0;
        optionText = '';
        if (option.option.indexOf('<img') > -1) {
            optionText = option.option.match(new RegExp("src=\"(.*?)\""))[1].replace('https://', '/test_result_img/');
            option.option = option.option.replace(/<(.*)\/>/g, '');
            img_temp.src = optionText;
            img_temp_properties = doc.getImageProperties(img_temp);
            Y_counter += img_temp_properties.height * scale + 4;
        }
        if (option.option.length > 0) {
            text = doc.splitTextToSize(option.option.replace('&quot;', '"'), Xmax - 8 - Xmin);
            Y_counter += 4 * text.length;
        }

        if (Y > Ymax - Y_counter) {
            doc.addPage('letter', 'p');
            Y = 15;
        }



        doc.setFontStyle("Bold");
        doc.text(itemBullet[index], Xmin, Y, { align: 'left' });
        switch (option.status) {
            case 'missed answer':
                doc.addImage(missedAnswer, 'PNG', Xmin + 4, Y - 2.6, 3, 3);
                break;
            case 'wrong answer':
                doc.addImage(wrongAnswer, 'PNG', Xmin + 4, Y - 2.6, 3, 3);
                break;
            case 'correct answer':
                doc.addImage(correctAnswer, 'PNG', Xmin + 4, Y - 2.6, 3, 3);
                break;

            default:
                break;
        }

        if (optionText.length > 0) {
            doc.addImage(img_temp, 'PNG', Xmin + 8, Y - 2.6, img_temp_properties.width * scale, img_temp_properties.height * scale);
            Y += img_temp_properties.height * scale + 4;
        }
        if (option.option.length > 0) {
            doc.setFontStyle("Normal");
            doc.text(text, Xmin + 8, Y, { align: 'justify' });
            Y += 4 * text.length;
        }

    });
    Y += 6;
    return Y;

}
