namespace TalentAI.API.DTOs;

public record LoginRequest(
    string Email,
    string Password,
    string Role
);

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role
);

public record GoogleLoginRequest(
    string IdToken,
    string Role
);

public record AuthResponse(
    string Token,
    int ExpiresIn,
    UserDto User
);

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string Role
);
