let questions = [];
let current = 0;
let micOn = true;

let seconds = 0;
let timerInterval;

let totalScore = 0;
let answeredCount = 0;
let suggestions = [];

let finalAnswer = "";
let isListening = false;
let currentQuestion = questions[current];

let answerTimer;     // 1 minute per question
let silenceTimer;    // 20 sec silence

// ===============================
// SPEECH RECOGNITION
// ===============================
let recognition = new webkitSpeechRecognition();

recognition.lang = "en-US";
recognition.continuous = true;
recognition.interimResults = true;

// ===============================
// PAGE LOAD
// ===============================
window.onload = function () {
    loadQuestions();
};

// ===============================
// LOAD QUESTIONS
// ===============================
async function loadQuestions() {

    let resumeText =
        localStorage.getItem("resumeText");

    document.querySelector("#currQuest h2").innerText =
        "Generating Questions...";

    try {

        let response =
            await fetch("/generateQuestions", {
                method: "POST",
                headers: {
                    "Content-Type":"text/plain"
                },
                body: resumeText
            });

        let data =
            await response.text();

        if(data.startsWith("ERROR")){
            document.querySelector("#currQuest h2").innerText =
                data;
            return;
        }

        let aiQuestions =
            data.split("\n")

                .map(q => q.trim())

                .filter(q => q !== "")

                .map(q => {

                    q = q.replace(/^\d+\.\s*/, "");
                    q = q.replace(/^[-*]\s*/, "");

                    if(q.includes(":")){
                        q = q.substring(
                            q.indexOf(":") + 1
                        );
                    }

                    q = q.replace(/^technical question/i,"");
                    q = q.replace(/^hr question/i,"");
                    q = q.replace(/^question/i,"");

                    return q.trim();
                })

                .filter(q => q !== "");

        aiQuestions =
            [...new Set(aiQuestions)];

        aiQuestions =
            aiQuestions.slice(0,9);

        questions = [];

        questions.push(
            "Tell me about yourself"
        );

        questions =
            questions.concat(aiQuestions);

        current = 0;

        showQuestion();
        startTimer();

    } catch(error){

        document.querySelector("#currQuest h2").innerText =
            "Server Error";
    }
}

// ===============================
// TOTAL INTERVIEW TIMER
// ===============================
function startTimer() {

    timerInterval =
        setInterval(function(){

            seconds++;

            let hrs =
                Math.floor(seconds / 3600);

            let mins =
                Math.floor((seconds % 3600) / 60);

            let secs =
                seconds % 60;

            document.getElementById("timerDisplay").innerText =
                format(hrs) + ":" +
                format(mins) + ":" +
                format(secs);

        },1000);
}

function format(num){
    return num < 10 ? "0" + num : num;
}

// ===============================
// SHOW QUESTION
// ===============================
function showQuestion() {

    let question =
        questions[current];

    document.querySelector("#currQuest h2").innerText =
        question;

    document.getElementById("answerText").innerText =
        "";

    document.getElementById("scoreText").innerText =
        "";

    finalAnswer = "";

    speakQuestion(question);

    startQuestionTimer(); // 1 min
}

// ===============================
// 1 MIN QUESTION TIMER
// ===============================
function startQuestionTimer() {

    clearTimeout(answerTimer);

    answerTimer =
        setTimeout(function(){

            // wait 2 sec for last speech words
            setTimeout(function(){
                moveNextQuestion();
            },2000);

        },40000);
}

// ===============================
// 10 SEC SILENCE TIMER
// ===============================
function startSilenceTimer() {

    clearTimeout(silenceTimer);

    silenceTimer =
        setTimeout(function(){

            moveNextQuestion();

        },10000);
}

// ===============================
// SPEAK QUESTION
// ===============================
function speakQuestion(text) {

    speechSynthesis.cancel();

    if(micOn){

        let speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "en-US";
        speech.rate = 1;

        speech.onend = function(){
            startListening();
        };

        speechSynthesis.speak(speech);

    }else{

        startListening();
    }
}

// ===============================
// START MIC
// ===============================
function startListening() {

    try{
        recognition.start();
        isListening = true;

        startSilenceTimer();

    }catch(e){}
}

// ===============================
// MIC RESULT
// ===============================
recognition.onresult = function(event){

    let liveText = "";

    for(let i = 0; i < event.results.length; i++){

        liveText +=
            event.results[i][0].transcript + " ";
    }

    finalAnswer =
        liveText.trim();

    document.getElementById("answerText").innerText =
        "Your Answer: " + finalAnswer;

    startSilenceTimer();
};

// ===============================
// Clean Sentence
// ===============================
function cleanSentence(text){

    text = text.replace(/\s+/g," ").trim();

    let words =
        text.split(" ");

    let result = [];

    for(let i=0;i<words.length;i++){

        if(
            i === 0 ||
            words[i].toLowerCase() !==
            words[i-1].toLowerCase()
        ){
            result.push(words[i]);
        }
    }

    let sentence =
        result.join(" ");

    sentence =
        sentence.charAt(0).toUpperCase() +
        sentence.slice(1);

    return sentence;
}

// ===============================
// AUTO RESTART MIC
// ===============================
recognition.onend = function(){

    if(isListening){

        setTimeout(function(){

            if(isListening){
                try{
                    recognition.start();
                }catch(e){}
            }

        },1000);
    }
};

// ===============================
// MIC ERROR
// ===============================
recognition.onerror = function(){
};

// ===============================
// MOVE NEXT QUESTION
// ===============================
function moveNextQuestion() {

    clearTimeout(answerTimer);
    clearTimeout(silenceTimer);

    isListening = false;

    try{
        recognition.stop();
    }catch(e){}

    if(finalAnswer.trim() !== ""){
        evaluateAnswer(finalAnswer);
    }else{
        nextQuestion();
    }
}

// ===============================
// CHECK ANSWER
// ===============================
async function evaluateAnswer(answer){

    try{

        let response =
            await fetch("/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    answer: finalAnswer
                })
            });

        let data =
            await response.text();

        let parts =
            data.split("|");

        let score =
            parts[0].trim();

        let feedback =
            parts[2] ? parts[2].trim() : "";

        let match =
            score.match(/\d+/);

        if(match){
            totalScore +=
                parseInt(match[0]);

            answeredCount++;
        }

        if(feedback !== ""){
            suggestions.push(feedback);
        }

        setTimeout(function(){
            nextQuestion();
        },1500);

    }catch(error){

        nextQuestion();
    }
}

// ===============================
// NEXT QUESTION
// ===============================
function nextQuestion() {

    current++;

    if(current >= questions.length){
        finishInterview();
        return;
    }

    showQuestion();
}

// ===============================
// FINISH INTERVIEW
// ===============================
function finishInterview() {

    clearTimeout(answerTimer);
    clearTimeout(silenceTimer);
    clearInterval(timerInterval);

    isListening = false;

    speechSynthesis.cancel();

    try{
        recognition.stop();
    }catch(e){}

    let finalScore = 0;

    if(answeredCount > 0){
        finalScore =
            Math.round(totalScore / answeredCount);
    }

    let minAnswered =
        Math.ceil(questions.length * 0.6);

    let status = "Rejected";

    if(
        answeredCount >= minAnswered &&
        finalScore >= 7
    ){
        status = "Selected";
    }

    localStorage.setItem(
        "totalQuestions",
        questions.length
    );

    localStorage.setItem(
        "answered",
        answeredCount
    );

    localStorage.setItem(
        "finalScore",
        finalScore + "/10"
    );

    localStorage.setItem(
        "status",
        status
    );

    localStorage.setItem(
        "timeTaken",
        document.getElementById("timerDisplay").innerText
    );

    localStorage.setItem(
        "suggestions",
        JSON.stringify(suggestions)
    );

    window.location.href =
        "/result";
}

// ===============================
// BUTTONS
// ===============================

// Skip
document.getElementById("btn2").onclick =
    function(){
        nextQuestion();
    };

// Next
document.getElementById("btn4").onclick =
    function(){
        moveNextQuestion();
    };

// End
document.getElementById("btn1").onclick =
    function(){
        finishInterview();
    };

// Mic Toggle
document.getElementById("btn3").onclick =
    function(){

        micOn = !micOn;

        if(micOn){

            document.getElementById("answerText").innerText =
                "Voice Unmuted";

            startListening();

        }else{

            isListening = false;

            clearTimeout(silenceTimer);

            try{
                recognition.stop();
            }catch(e){}

            speechSynthesis.cancel();

            document.getElementById("answerText").innerText =
                "Voice Muted";
        }
    };