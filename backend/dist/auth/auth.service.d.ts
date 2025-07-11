import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            username: any;
            isAdmin: any;
        };
    }>;
    register(registerDto: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            username: any;
            isAdmin: any;
        };
    }>;
}
