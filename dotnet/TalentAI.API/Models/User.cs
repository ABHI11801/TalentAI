using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentAI.API.Models;

[Table("Users")]
public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    // Null for Google-authenticated users
    public string? PasswordHash { get; set; }

    [Required, MaxLength(50)]
    public string Role { get; set; } = "Recruiter"; // Recruiter | HR Manager | Admin

    public string? GoogleId { get; set; }           // Google sub claim

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }
}
