import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            username: any;
            isAdmin: any;
        };
    }>;
    register(registerDto: any): Promise<any>;
}
