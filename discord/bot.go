package discord

import (
	"fmt"
	"one-api/common"
	"one-api/controller"
	"one-api/model"
	"one-api/setting"
	"strings"

	"github.com/bwmarrin/discordgo"
)

var (
	Session *discordgo.Session
)

func Init() error {
	var err error
	Session, err = discordgo.New("Bot " + setting.DiscordBotToken)
	if err != nil {
		return fmt.Errorf("error creating Discord session: %v", err)
	}

	Session.AddHandler(messageCreate)
	Session.Identify.Intents = discordgo.IntentsGuildMessages

	err = Session.Open()
	if err != nil {
		return fmt.Errorf("error opening connection: %v", err)
	}

	return nil
}

func messageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	if m.Author.ID == s.State.User.ID {
		return
	}

	if !setting.IsDiscordAdmin(m.Author.ID) {
		s.ChannelMessageSend(m.ChannelID, "You don't have permission to use this bot.")
		return
	}

	parts := strings.Fields(strings.ToLower(m.Content))
	if len(parts) == 0 {
		return
	}

	switch parts[0] {
	case "!testall":
		handleTestAll(s, m)
	case "!channels":
		handleListChannels(s, m)
	case "!addadmin":
		handleAddAdmin(s, m, parts)
	case "!removeadmin":
		handleRemoveAdmin(s, m, parts)
	case "!help":
		handleHelp(s, m)
	}
}

func handleTestAll(s *discordgo.Session, m *discordgo.MessageCreate) {
	s.ChannelMessageSend(m.ChannelID, "Testing all channels... This may take a while.")
	
	err := controller.TestAllChannels(true)
	if err != nil {
		s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Error testing channels: %v", err))
		return
	}

	s.ChannelMessageSend(m.ChannelID, "Channel testing has been initiated. You will be notified of the results.")
}

func handleListChannels(s *discordgo.Session, m *discordgo.MessageCreate) {
	channels, err := model.GetAllChannels(0, 0, true, false)
	if err != nil {
		s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Error getting channels: %v", err))
		return
	}

	var activeChannels strings.Builder
	activeChannels.WriteString("Active OpenAI Channels:\n```\n")
	
	for _, ch := range channels {
		if ch.Type == common.ChannelTypeOpenAI && ch.Status == common.ChannelStatusEnabled {
			activeChannels.WriteString(fmt.Sprintf("ID: %d | Name: %s | Models: %s\n",
				ch.Id, ch.Name, ch.Models))
		}
	}
	activeChannels.WriteString("```")

	s.ChannelMessageSend(m.ChannelID, activeChannels.String())
}

func handleAddAdmin(s *discordgo.Session, m *discordgo.MessageCreate, parts []string) {
	if len(parts) != 2 {
		s.ChannelMessageSend(m.ChannelID, "Usage: !addadmin <user_id>")
		return
	}

	userId := parts[1]
	setting.AddDiscordAdmin(userId)
	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Added user %s as admin", userId))
}

func handleRemoveAdmin(s *discordgo.Session, m *discordgo.MessageCreate, parts []string) {
	if len(parts) != 2 {
		s.ChannelMessageSend(m.ChannelID, "Usage: !removeadmin <user_id>")
		return
	}

	userId := parts[1]
	setting.RemoveDiscordAdmin(userId)
	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Removed user %s from admins", userId))
}

func handleHelp(s *discordgo.Session, m *discordgo.MessageCreate) {
	help := `Available commands:
!testall - Test all channels
!channels - List active OpenAI channels
!addadmin <user_id> - Add a Discord user as admin
!removeadmin <user_id> - Remove a Discord admin
!help - Show this help message`

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("```%s```", help))
}

func Close() {
	if Session != nil {
		Session.Close()
	}
}