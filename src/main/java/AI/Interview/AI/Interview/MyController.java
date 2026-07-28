package AI.Interview.AI.Interview;
import AI.Interview.AI.Interview.Entity.User;
import AI.Interview.AI.Interview.Services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import AI.Interview.AI.Interview.Services.OpenRouterService;


@Controller
public class MyController {
    @Autowired
    private UserService userService;

    @Autowired
    private OpenRouterService openRouterService;

    @GetMapping("/aiinterview")
    public String aiinterview() {
        return "LandingPage";
    }

    @GetMapping("/RegistrationPage")
    public String registrationPage(Model model) {
        model.addAttribute("user", new User());
        return "RegistrationPage";
    }

    @GetMapping("/loginPage")
    public String loginPage(Model model) {
        model.addAttribute("user", new User());
        return "LoginPage";
    }

    @GetMapping("/dash")
    public String dash(HttpSession session, Model model) {

        User user = (User) session.getAttribute("loginUser");
        if(user == null){
            return "redirect:/loginPage";
        }
        model.addAttribute("UserName", user.getUserName());
        model.addAttribute("role", user.getRole());

        return "DashboardPage";
    }


    @GetMapping("/Logout")
    public String logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return "redirect:/loginPage";
    }

    @PostMapping("/Dashboard")
    public String submitLoginForm(@ModelAttribute("user") User user, Model model, HttpSession session) {

        User validUser =userService.userLogin(user.getEmail(), user.getPassword());
        if(validUser != null){
            session.setAttribute("loginUser",validUser);
            model.addAttribute("UserName",validUser.getUserName());
            model.addAttribute("role", validUser.getRole());
            return "DashboardPage";

        }else{
            model.addAttribute("ErrorMsgs", "Email and Password did not match");
            return "LoginPage";
        }
    }

    @PostMapping("/regForm")
    public String submitForm(@ModelAttribute("user") User user, Model model) {
        boolean status = userService.userRegister(user);
        if (status) {
            model.addAttribute("successMsg", "User Registered Successfully, Login Here 👇");
        } else {
            model.addAttribute("ErrorMsg", "User Not Registered");
        }
        return "RegistrationPage";
    }

    @GetMapping("/voiceRoom")
    public String voiceRoom(HttpSession session, Model model) {
        User user = (User) session.getAttribute("loginUser");
        model.addAttribute("role", user.getRole());
        String str = user.getUserName();
        String user1="";
        user1=String.valueOf(str.charAt(0));
        for (int i = 0; i < str.length(); i++){
            if (str.charAt(i)==' '){
                user1=user1+String.valueOf(str.charAt(i+1));
            }
        }
              model.addAttribute("userNme", user1);
        return "VoiceRoom";
    }

    @PostMapping("/evaluate")
    @ResponseBody
    public String evaluate(@RequestBody String answer) {

        String prompt =
                "You are an experienced technical interviewer.\n\n" +

                        "Evaluate the candidate's answer professionally.\n\n" +

                        "Rules:\n" +
                        "1. Score out of 10.\n" +
                        "2. Mention Correct or Incorrect.\n" +
                        "3. Give only ONE short improvement suggestion.\n" +
                        "4. Reply ONLY in this format:\n\n" +

                        "Score: X/10 | Correct | Suggestion\n\n" +

                        "Candidate Answer:\n" +
                        answer;

        return openRouterService.chat(prompt);
    }


    @PostMapping("/generateQuestions")
    @ResponseBody
    public String generateQuestions(@RequestBody String resume) {

        String prompt =
                """
                You are an expert technical interviewer.
                
                Analyze the candidate's resume and generate EXACTLY 9 interview questions.
                
                Rules:
                - Generate only questions.
                - No numbering.
                - No bullets.
                - No headings.
                - No labels like Technical Question:, HR Question:, Java:, SQL:, etc.
                - Generate 5 technical questions based on the candidate's resume.
                - Generate 4 HR/behavioral questions.
                - Generate simple and Fresher level based Questions.
                - Questions should be similar to interviews at Google, Microsoft, Amazon, Infosys, Wipro and TCS.
                - Keep questions concise and professional.
                - Do NOT generate "Tell me about yourself".
                - Do NOT generate Question more than 30 words.
                
                Resume:
                
                """ + resume;

        return openRouterService.chat(prompt);
    }

    @GetMapping("/result")
    public String result(){
        return "ResultPage";
    }

}
