using System.Text.Json.Serialization;

namespace MuseumTwilight;

public sealed record RelicDefinition(string Id, string Name, int RequiredFragments, string Archive);
public sealed record RelicProgress(string RelicId, int Fragments, bool ArchiveUnlocked);

public sealed class RelicManager
{
    private readonly IReadOnlyDictionary<string, RelicDefinition> definitions;

    public RelicManager(IEnumerable<RelicDefinition> definitions)
    {
        this.definitions = definitions.ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);
    }

    public int CalculateRestorationPercent(string relicId, int fragments)
    {
        var definition = GetDefinition(relicId);
        var clamped = Math.Clamp(fragments, 0, definition.RequiredFragments);
        return (int)Math.Floor(clamped * 100d / definition.RequiredFragments);
    }

    public RelicProgress Restore(string relicId, int currentFragments, int addedFragments)
    {
        var definition = GetDefinition(relicId);
        var fragments = Math.Clamp(currentFragments + Math.Max(0, addedFragments), 0, definition.RequiredFragments);
        return new RelicProgress(relicId, fragments, fragments >= definition.RequiredFragments);
    }

    public bool CanUnlockArchive(string relicId, int fragments)
        => CalculateRestorationPercent(relicId, fragments) == 100;

    private RelicDefinition GetDefinition(string relicId)
        => definitions.TryGetValue(relicId, out var definition)
            ? definition
            : throw new KeyNotFoundException($"Unknown relic: {relicId}");
}
