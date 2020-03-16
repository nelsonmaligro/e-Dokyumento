
##############################################################################
#  GNU UnRTF, a command-line program to convert RTF documents to other formats.
#  Copyright (C) 2000,2001 Zachary Thayer Smith
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#
#  The author is reachable by electronic mail at tuorfa@yahoo.com.
##############################################################################

#
# Makefile for UnRTF
#


CFLAGS=-g -Wall
CC=gcc

OBJS=convert.o word.o error.o main.o hash.o \
	parse.o malloc.o attr.o util.o \
	output.o html.o text.o vt.o ps.o latex.o wpml.o entity.o

TARGET=unrtf

${TARGET}:	${OBJS}
	gcc ${OBJS} -o ${TARGET}

clean:
	rm -f ${OBJS} ${TARGET} bcount bcount.o

tidy:
	rm -f ${OBJS} bcount.o
	strip ${TARGET}

tests:
	${TARGET} test/table.rtf > test/table.html
	${TARGET} test/slashnewline.rtf > test/slashnewline.html
	${TARGET} test/fontface.rtf > test/fontface.html
	${TARGET} test/fontsize.rtf > test/fontsize.html

bcount:	bcount.c
	gcc bcount.c -o bcount

all:	${TARGET} bcount
	rm -f ${OBJS}

install:	${TARGET}
	cp ${TARGET} /usr/local/bin

attr.o: attr.c defs.h error.h attr.h main.h malloc.h
convert.o: convert.c attr.h convert.h defs.h error.h hash.h main.h malloc.h \
	parse.h util.h word.h
entity.o: entity.c
error.o: error.c defs.h main.h
hash.o: hash.c error.h hash.h main.h malloc.h
html.o: html.c defs.h error.h main.h malloc.h output.h
latex.o: latex.c defs.h error.h main.h malloc.h output.h
main.o: main.c convert.h defs.h error.h hash.h html.h latex.h output.h \
	parse.h ps.h text.h vt.h wpml.h word.h
malloc.o: malloc.c error.h
output.o: output.c convert.h defs.h error.h main.h malloc.h output.h
parse.o: parse.c defs.h error.h main.h malloc.h parse.h word.h
ps.o: ps.c defs.h error.h main.h malloc.h output.h
text.o: text.c defs.h error.h main.h malloc.h output.h
util.o: util.c
vt.o: vt.c defs.h error.h main.h malloc.h output.h
word.o: word.c defs.h error.h hash.h main.h malloc.h parse.h word.h
wpml.o: wpml.c defs.h error.h main.h malloc.h output.h
