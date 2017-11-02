for i in 1 2 3 4 5 6 7 8 9 0
do
	for j in a b c d e f g h i j k l m n o p q u r s t w x y z
	do
		for k in 0 9 8 7 6 5 4 3 2 1
		do
			node ttTest ${1}-${j}-${i}-${j}:${k}: 100
		done
	done
	sleep 1
done
		
