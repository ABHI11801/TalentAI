using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TalentAI.API.Data;
using TalentAI.API.DTOs;
using TalentAI.API.Models;

namespace TalentAI.API.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> GoogleLoginAsync(GoogleLoginRequest request);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db     = db;
        _config = config;
    }

    // ── Email / Password ──────────────────────────────────────
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower() && u.IsActive);

        if (user is null || user.PasswordHash is null)
            return null;

        // BCrypt verify
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return BuildResponse(user);
    }

    // ── Google Sign-In ────────────────────────────────────────
    public async Task<AuthResponse?> GoogleLoginAsync(GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _config["Google:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch
        {
            return null; // Invalid Google token
        }

        // Find or create user
        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

        if (user is null)
        {
            // First Google login — register automatically
            user = await _db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email.ToLower());

            if (user is null)
            {
                user = new User
                {
                    FullName = payload.Name,
                    Email    = payload.Email.ToLower(),
                    GoogleId = payload.Subject,
                    Role     = request.Role
                };
                _db.Users.Add(user);
            }
            else
            {
                user.GoogleId = payload.Subject; // Link Google to existing account
            }
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return BuildResponse(user);
    }

    // ── JWT builder ───────────────────────────────────────────
    private AuthResponse BuildResponse(User user)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(int.Parse(_config["Jwt:ExpiresInHours"] ?? "8"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name,  user.FullName),
            new Claim(ClaimTypes.Role,               user.Role),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:   _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims:   claims,
            expires:  expires,
            signingCredentials: creds
        );

        var tokenStr   = new JwtSecurityTokenHandler().WriteToken(token);
        var expiresIn  = (int)(expires - DateTime.UtcNow).TotalSeconds;

        return new AuthResponse(
            Token:     tokenStr,
            ExpiresIn: expiresIn,
            User: new UserDto(user.Id, user.FullName, user.Email, user.Role)
        );
    }
}
