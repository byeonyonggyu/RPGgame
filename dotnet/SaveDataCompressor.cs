using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MuseumTwilight;

/// <summary>Versioned offline envelope. SHA-256 detects corruption, not malicious edits or authentication.</summary>
public static class SaveDataCompressor
{
    public const int MaxJsonBytes = 16 * 1024 * 1024;
    public sealed record Envelope(int Version, string Algorithm, string Sha256, string Payload);

    public static byte[] Compress(string json)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(json);
        if (bytes.Length > MaxJsonBytes) throw new InvalidDataException("Save is too large.");
        using var document = JsonDocument.Parse(bytes);
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Optimal, leaveOpen: true)) gzip.Write(bytes);
        var envelope = new Envelope(1, "gzip+sha256", Convert.ToHexString(SHA256.HashData(bytes)), Convert.ToBase64String(output.ToArray()));
        return JsonSerializer.SerializeToUtf8Bytes(envelope);
    }

    public static string Decompress(ReadOnlySpan<byte> backup)
    {
        if (backup.Length > MaxJsonBytes * 2) throw new InvalidDataException("Backup is too large.");
        var envelope = JsonSerializer.Deserialize<Envelope>(backup) ?? throw new InvalidDataException("Missing envelope.");
        if (envelope.Version != 1 || envelope.Algorithm != "gzip+sha256") throw new InvalidDataException("Unsupported envelope.");
        byte[] expected;
        byte[] compressed;
        try { expected = Convert.FromHexString(envelope.Sha256); compressed = Convert.FromBase64String(envelope.Payload); }
        catch (Exception ex) when (ex is FormatException or ArgumentNullException) { throw new InvalidDataException("Malformed envelope.", ex); }
        if (expected.Length != 32) throw new InvalidDataException("Invalid hash length.");
        using var input = new MemoryStream(compressed);
        using var gzip = new GZipStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        var buffer = new byte[8192];
        int count;
        while ((count = gzip.Read(buffer)) > 0)
        {
            if (output.Length + count > MaxJsonBytes) throw new InvalidDataException("Expanded save is too large.");
            output.Write(buffer, 0, count);
        }
        byte[] bytes = output.ToArray();
        if (!CryptographicOperations.FixedTimeEquals(expected, SHA256.HashData(bytes))) throw new InvalidDataException("Save checksum mismatch.");
        using var document = JsonDocument.Parse(bytes);
        return new UTF8Encoding(false, true).GetString(bytes);
    }
}
