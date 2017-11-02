
i=0

while [[ ${i} -lt ${1} ]]  
do
	node testPost.js localhost 5000 put ${i}${2} 
	i=`expr ${i} + 1`
done
