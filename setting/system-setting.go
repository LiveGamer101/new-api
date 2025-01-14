package setting

var ServerAddress = "http://localhost:3000"
var WorkerUrl = ""
var WorkerValidKey = ""
var DiscordBotToken = ""
var DiscordAdminUserIds = make(map[string]bool)

func EnableWorker() bool {
	return WorkerUrl != ""
}

func EnableDiscordBot() bool {
	return DiscordBotToken != ""
}

func IsDiscordAdmin(userId string) bool {
	return DiscordAdminUserIds[userId]
}

func AddDiscordAdmin(userId string) {
	DiscordAdminUserIds[userId] = true
}

func RemoveDiscordAdmin(userId string) {
	delete(DiscordAdminUserIds, userId)
}
