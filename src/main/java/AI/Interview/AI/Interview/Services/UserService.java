package AI.Interview.AI.Interview.Services;

import AI.Interview.AI.Interview.Entity.User;

public interface UserService {
    public boolean userRegister(User user);

    public User userLogin(String email, String password);
}
