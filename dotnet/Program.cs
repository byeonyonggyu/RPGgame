using MuseumTwilight;

if (args.Length == 1 && args[0] == "--verify-compressor")
{
    const string json = "{\"character\":\"하연\",\"inventory\":{\"옹기\":3}}";
    var packed = SaveDataCompressor.Compress(json);
    if (SaveDataCompressor.Decompress(packed) != json) throw new Exception("GZip roundtrip failed.");
    var node = System.Text.Json.Nodes.JsonNode.Parse(packed)!;
    node["Sha256"] = new string('0', 64);
    bool rejected = false;
    try { SaveDataCompressor.Decompress(System.Text.Encoding.UTF8.GetBytes(node.ToJsonString())); }
    catch (InvalidDataException) { rejected = true; }
    if (!rejected) throw new Exception("Corrupt hash was accepted.");
    rejected = false;
    try { SaveDataCompressor.Compress("not json"); }
    catch (System.Text.Json.JsonException) { rejected = true; }
    if (!rejected) throw new Exception("Invalid JSON was accepted.");
    Console.WriteLine("PASS: UTF-8 GZip roundtrip, SHA-256 corruption rejection, invalid JSON rejection.");
    return;
}
if (args.Length == 3 && args[0] == "--backup")
{
    await File.WriteAllBytesAsync(args[2], SaveDataCompressor.Compress(await File.ReadAllTextAsync(args[1])));
    Console.WriteLine("Compressed backup created."); return;
}
if (args.Length == 3 && args[0] == "--restore-backup")
{
    await File.WriteAllTextAsync(args[2], SaveDataCompressor.Decompress(await File.ReadAllBytesAsync(args[1])));
    Console.WriteLine("Backup verified and restored."); return;
}

var relics = new[]
{
    new RelicDefinition("pointmal_onggi", "점말 옹기", 12, "옹기는 숨 쉬는 그릇으로 불리며 저장과 발효에 쓰였다."),
    new RelicDefinition("gogang_stone_sword", "고강동 간돌검", 10, "고강동 선사유적을 모티브로 한 간돌검 자료."),
    new RelicDefinition("hwayu_mirror", "화유옹주 거울", 8, "조선 후기 화유옹주 묘 부장품에서 모티브를 얻은 거울.")
};
var manager = new RelicManager(relics);
var save = new SaveData(1, 0, "day", new Dictionary<string, int> { ["pointmal_onggi"] = 12 }, 0, DateTimeOffset.UtcNow);
var handler = new SaveDataHandler();
var path = args.Length > 0 ? args[0] : "savegame.json";
await handler.SaveAsync(path, save);
var loaded = await handler.LoadAndValidateAsync(path);
Console.WriteLine($"Save OK: stage={loaded.CurrentStage}, phase={loaded.Phase}, ongii={manager.CalculateRestorationPercent("pointmal_onggi", loaded.RelicFragments["pointmal_onggi"])}%");
