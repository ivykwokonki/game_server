// getNextSequenceValue = function getNextSequenceValue(sequenceName){
// 	var sequenceDocument = db.counters.findAndModify({
// 	query:{_id: sequenceName },
// 	update: {$inc:{sequence_value:1}},
// 	new:true
// 	});

// 	return sequenceDocument.sequence_value;
// };

// module.exports.getNextSequenceValue = getNextSequenceValue;

// url = "http://localhost:8080/";
url = "http://35.187.217.141:8080/";

function deleteQuiz(id){
console.log("receive deleteQuiz!");
    $.ajax({
		type: "GET",
		url: url + "api/deleteQuiz/?id=" + id ,
		contentType: "application/json",
		dataType: "json",
		complete: function (data) {
                console.log("yes");
				window.location.reload();
		},

    })
}