using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MuseumTwilight;

public sealed record SaveData(
    int Version,
    int CurrentStage,
    string Phase,
    IReadOnlyDictionary<string, int> RelicFragments,
    double ClearTimeSeconds,
    DateTimeOffset SavedAt);

public sealed record SaveEnvelope(SaveData Payload, string Checksum);

public sealed class SaveDataHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private const string IntegritySalt = "museum-twilight-save-v1";

    public async Task SaveAsync(string path, SaveData data, CancellationToken cancellationToken = default)
    {
        var payloadJson = JsonSerializer.Serialize(data, JsonOptions);
        var envelope = new SaveEnvelope(data, ComputeChecksum(payloadJson));
        var json = JsonSerializer.Serialize(envelope, JsonOptions);
        await File.WriteAllTextAsync(path, json, Encoding.UTF8, cancellationToken);
    }

    public async Task<SaveData> LoadAndValidateAsync(string path, CancellationToken cancellationToken = default)
    {
        var json = await File.ReadAllTextAsync(path, Encoding.UTF8, cancellationToken);
        var envelope = JsonSerializer.Deserialize<SaveEnvelope>(json, JsonOptions)
            ?? throw new InvalidDataException("Save file is empty or malformed.");
        var payloadJson = JsonSerializer.Serialize(envelope.Payload, JsonOptions);
        var expected = ComputeChecksum(payloadJson);
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(expected), Convert.FromHexString(envelope.Checksum)))
            throw new InvalidDataException("Save integrity check failed.");
        return envelope.Payload;
    }

    private static string ComputeChecksum(string payloadJson)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(IntegritySalt + payloadJson));
        return Convert.ToHexString(bytes);
    }
}
