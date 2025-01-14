package common

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"one-api/constant/discord"
	"one-api/logging"
)

var (
	Port             = flag.Int("port", 3000, "the listening port")
	PrintVersion     = flag.Bool("version", false, "print version and exit")
	PrintHelp        = flag.Bool("help", false, "print help and exit")
	logDir           = flag.String("log-dir", "./logs", "specify the log directory")
	DiscordBotToken  = ""
	DiscordAdminIds  = make(map[string]bool)
)

func init() {
	logging.LogDir = logDir
}

func printHelp() {
	fmt.Println("New API " + Version + " - All in one API service for OpenAI API.")
	fmt.Println("Copyright (C) 2023 JustSong. All rights reserved.")
	fmt.Println("GitHub: https://github.com/songquanpeng/one-api")
	fmt.Println("Usage: one-api [--port <port>] [--log-dir <log directory>] [--version] [--help]")
}

func LoadEnv() {
	flag.Parse()

	if *PrintVersion {
		fmt.Println(Version)
		os.Exit(0)
	}

	if *PrintHelp {
		printHelp()
		os.Exit(0)
	}

	if os.Getenv("SESSION_SECRET") != "" {
		ss := os.Getenv("SESSION_SECRET")
		if ss == "random_string" {
			log.Println("WARNING: SESSION_SECRET is set to the default value 'random_string', please change it to a random string.")
			log.Println("警告：SESSION_SECRET被设置为默认值'random_string'，请修改为随机字符串。")
			log.Fatal("Please set SESSION_SECRET to a random string.")
		} else {
			SessionSecret = ss
		}
	}
	if os.Getenv("CRYPTO_SECRET") != "" {
		CryptoSecret = os.Getenv("CRYPTO_SECRET")
	} else {
		CryptoSecret = SessionSecret
	}
	if os.Getenv("SQLITE_PATH") != "" {
		SQLitePath = os.Getenv("SQLITE_PATH")
	}

	// Load Discord bot settings
	if os.Getenv(discord.BotTokenEnvKey) != "" {
		DiscordBotToken = os.Getenv(discord.BotTokenEnvKey)
	}
	
	// Load Discord admin IDs
	adminIds := GetEnvAsStringSlice(discord.AdminIDsEnvKey, ",")
	for _, id := range adminIds {
		DiscordAdminIds[strings.TrimSpace(id)] = true
	}
	if *logDir != "" {
		var err error
		*logDir, err = filepath.Abs(*logDir)
		if err != nil {
			log.Fatal(err)
		}
		if _, err := os.Stat(*logDir); os.IsNotExist(err) {
			err = os.Mkdir(*logDir, 0777)
			if err != nil {
				log.Fatal(err)
			}
		}
	}
}
