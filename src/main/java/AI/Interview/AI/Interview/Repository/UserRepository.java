package AI.Interview.AI.Interview.Repository;
import AI.Interview.AI.Interview.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User,Integer> {
    User findByEmail(String email);
}

