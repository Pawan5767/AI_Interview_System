package AI.Interview.AI.Interview.Services;
import AI.Interview.AI.Interview.Entity.User;
import AI.Interview.AI.Interview.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean userRegister(User user){
        try{
            userRepository.save(user);
            return true;
        }
        catch (Exception e){
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public User userLogin(String email, String password) {
       User validUser = userRepository.findByEmail(email);
       if(validUser != null && validUser.getPassword().equals(password)){
           return validUser;
       }
        return null;
    }
}