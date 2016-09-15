#!/bin/sh
cd images
echo "" > ../app/file_types.css
for f in *.png
do
	ff=${f%%.*}
	echo ".icon-$ff { background-image: url(data:image/png;base64,$(base64 -w 0 $f)) !important;}" >> ../app/file_types.css
done
cd /e/work/www/share/images
echo "" > /e/work/www/formbuilder2/app/icons.css
for p in *.png
do
	ff=${p%%.*}
	echo ".icon-$ff { background-image: url(data:image/png;base64,$(base64 -w 0 $p)) !important;}" >> /e/work/www/formbuilder2/app/icons.css
done
