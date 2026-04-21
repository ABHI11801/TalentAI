using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalentAI.API.Data;
using TalentAI.API.DTOs;
using TalentAI.API.Services;

namespace TalentAI.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly AppDbContext _db;

    public AuthController(IAuthService auth, AppDbContext db)
    {
        _auth = auth;
        _db   = db;
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password." });
        return Ok(result);
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
        if (existing != null)
            return BadRequest(new { message = "Email already exists." });

        var user = new TalentAI.API.Models.User
        {
            FullName     = request.FullName,
            Email        = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role         = request.Role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var result = await _auth.LoginAsync(new LoginRequest(request.Email, request.Password, request.Role));
        return Ok(result);
    }

    // POST api/auth/google
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
            return BadRequest(new { message = "Google token is required." });

        var result = await _auth.GoogleLoginAsync(request);
        if (result is null)
            return Unauthorized(new { message = "Google sign-in failed." });
        return Ok(result);
    }
}