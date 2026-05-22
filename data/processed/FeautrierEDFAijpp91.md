Data�ow Analysis of Array and Scalar References 

Paul Feautrier� Septemb er 

**==> picture [49 x 9] intentionally omitted <==**

**----- Start of picture text -----**<br>
Abstract<br>**----- End of picture text -----**<br>


Given a program written in a simple imp erative language (assignment statements, for lo ops, a�ne indices and lo op limits), this pap er presents an algorithm for analyzing the patterns along which values �ow as the execution pro ceeds. For each array or scalar reference, the result is the name and iteration vector of the source statement as a function of the iteration vector of the referencing statement. The pap er discusses several applications of the metho d: conversion of a program to a set of recurrence equations, array and scalar expansion, program veri�cation and parallel program construction. 

Keywords data�ow analysis, semantics analysis, array expansion. 

## Intro duction 

It is a well known fact that scienti�c programs sp end most of their running time in executing lo ops op erating on arrays. Hence if a restructuring or optimizing compiler is to do a go o d job, it must b e able to do a thorough analysis of the addressing patterns in such lo ops. If taken in full generality, the analysis problem is intractable. In this pap er, we consider a class of programs for which this analysis is p ossible : programs with so-called static 

� Lab oratoire MASI, Universit�e P. et M. Curie, PARIS CEDEX 0 FRANCE, e-mail: feautrier@masi.ibp.fr 

**==> picture [7 x 9] intentionally omitted <==**

control and a�ne indices. There are reasons to b elieve that a large prop ortion of all numerical programs b elongs to this class, and that many more may b e converted to it by appropriate prepro cessing. The analysis of addressing patterns in this class may b e reduced to the solution of parametric systems of linear inequalities in integers, for which the author has devised an e�cient algorithm []. 

The central problem to b e solved here is the following: given an array cell, which of several statements is the source of the value contained therein at a given instant in the execution of a program. Most of the time, the statement will b e emb edded in a lo op nest. Hence, we will require not only the name of the source statement, but also the values of the lo op counters at the time the value of interest was generated. This information may b e packaged as a source function, as the source will dep end on the iteration vector of the destination. We will give here a solution for programs with for lo ops as the only control statement. As a particular case, our metho d gives a general solution to the problem of the source of scalars, which may b e seen as degenerate arrays with no indices. A knowledge of the source function allows one to solve many problems which include automatic translation to single assignment form, array and scalar expansion, dead co de elimination, and various questions connected to the construction of programs for vector and parallel pro cessors. 

**==> picture [93 x 11] intentionally omitted <==**

**----- Start of picture text -----**<br>
. Outline<br>**----- End of picture text -----**<br>


Section describ es the simple programming language we will use for giving examples and the necessary restrictions on its indexing functions and lo op limits. We will also intro duce the sequencing predicate as a compact notation for deciding which of two statement instances is executed �rst. Section is the central part of the pap er; here we give a detailed account of the data�ow computation. Section outlines in varying detail several applications of the technique. Section lists some previous results which may b e seen as particular cases of the metho ds we have intro duced in section . In the conclusion, we give some empirical evidence on the complexity of the algorithm and p oint to several p ossible extensions. The parametric integer algorithm, which is a basic comp onent of the present metho d, is summarized in the app endix. For a more detailed presentation and pro ofs the reader is referred to the ab ove quoted pap er []. 

**==> picture [7 x 9] intentionally omitted <==**

. Notations Bold letters will denote vectors or vector valued functions; jaj is the dimension of vector a. a[i::j ] is the subvector of a built from comp onents i to j . a[i] is a shorthand for a[i::i]. Familiar op erators and predicates like + and � will b e tacitly extended to vectors. The sign � will denote lexical ordering of vectors. Large letters will usually denote sets; N will b e the set of non-negative integers. If A is a matrix, Aij will b e its generic element, Ai� its generic row and A�j its generic column. 

**==> picture [64 x 13] intentionally omitted <==**

**----- Start of picture text -----**<br>
The<br>**----- End of picture text -----**<br>


## Program 

## Mo del 

In this section, we will �rst describ e the syntax of the source language. We will then discuss the restrictions we sup erimp ose on this syntax. In the following development, we will distinguish b etween statements , which are syntactic parts of the program text, and op erations , which are actions inducing mo di�cations of the computer store. Most often, a statement will b e executed several times, giving rise to many distinct op erations. We will intro duce the sequencing predicate as a means of sp ecifying the execution order of op erations. 

## . The Source 

## Language 

The source language may b e seen either as a static PASCAL or as a rationalized FORTRAN. In fact, our work is not ab out any particular language, but ab out the static subset of most programming languages, i.e. ab out what happ ens when all memory allo cation has b een taken care of. Data typ es will b e restricted to integers, reals, and n-dimensional arrays of integers and reals. The only simple statements we will consider will b e scalar and array assignments. The only control constructs will b e the sequence and the for lo op. We will extend the language in order to allow conditional expressions (�a la Algol 0), which are necessary for the expression of index calculations (see e.g. section .). The syntax will b e: 

<conditional expression> := if <boolean expression> then <expression> else <expression> 

**==> picture [7 x 9] intentionally omitted <==**

Note the absence of goto's, of conditional statements, of while lo ops and of pro cedures. 

. Restrictions To b e able to analyze array accesses inside lo ops, one must have some knowledge of the iteration count of these lo ops. The simplest case is when limits are known numerical values. This, however, is much to o restrictive, since many programs use variable limits (matrix and vector dimensions, discretization size, etc.) and even non rectangular lo op nests: consider for instance the prevalence in numerical analysis of triangularization algorithms (like those of Gauss or Cholesky). To extend the class of tractable programs, we will intro duce the notion of static control. 

To recognize a static control program, one must �rst identify its structure parameters: a set of integer variables which are de�ned only once in the program, and whose value dep ends only on the outside world (through an input statement) or on other already de�ned structure parameters. A program has static control if all its lo ops are for lo ops whose limits dep end only on structure parameters, numerical constants and outer lo ops iteration counters. The analysis technique which is presented here is applicable only if all lo ops have increment , and if all limits are a�ne functions. For similar reasons, all indices will b e restricted to a�ne functions of the lo op counters and the structure parameters. 

We will use the fact that in a correct program, array indices are always within the array b ounds. Hence, two array references address the same memory lo cation if and only if they are references to the same array and their indices are equal. This restriction is not to o severe if we note, �rst, that it is go o d programming practice to debug a program b efore submitting it to an optimizing or restructuring compiler, and also that the metho ds of this pap er may b e used as a highly e�cient array access checker []. This hyp othesis will allow us to ignore array declarations. As a consequence, our technique will b e equally applicable to languages which enforce constant array b ounds { Fortran, Pascal, C, ... { and to those which do not. 

**==> picture [7 x 9] intentionally omitted <==**

. The Sequencing Predicate Values in array elements are pro duced by execution of statements. Hence we need a notation to pin-p oint a sp eci�c execution of a statement, or op eration. Our �rst need is an unambiguous designation of a statement in a program. Neither the text of the statement nor its p osition in the program syntax tree will serve, since there may b e several statements with the same text, and since the program may b e mo di�ed by a restructuring compiler. Hence we will use a set of arbitrary statement names, which will b e denoted by letters such as r , s, etc. In a practical application, a natural choice for these names may b e p ointers to records containing the statement descriptions. In the balance of this pap er, we will mostly b e interested in simple statements. However, some discussions will b e clearer if all statements, comp ound or simple, are named. In our source language, the only rep etitive construct is the for lo op. Hence, an op eration is uniquely de�ned by the name of the statement and the values of the surrounding lo op counters (the iteration vector []). A pair such as (r; a) whose comp onents are a statement name and an integer vector will b e called an (op eration) co ordinate. To denote a statement instance, a co ordinate must satisfy two conditions: 

� the dimension of a must b e equal to the numb er of lo ops surrounding r ; � all comp onents of a must b e within the corresp onding lo op limits. 

With each lo op t we may asso ciate a pair of inequalities: 

**==> picture [70 x 12] intentionally omitted <==**

where a is the lo op counter of t. If a statement r is emb edded in a lo op nest t ; t ; : : : ; tN , in that order, then the iteration vector a of r must satisfy: 

**==> picture [389 x 68] intentionally omitted <==**

**==> picture [7 x 9] intentionally omitted <==**

where er is an a�ne vector-valued function. Formula () will b e called the existence predicate of r . Notice that we do not supp ose that l bt � ubt . In accordance with the Pascal convention (and with the \mo dern" interpretation of Fortran DO lo ops), a lo op whose limits violate this inequality will not b e executed at all. 

Consider for example the program sketch in �gure . Figure describ es its iteration domain. The existence predicate of statement s may b e written as: 

0B � 00 C i 0B �n C BB � CC j + BB � CC � 0: ! 0 � n @ A @ A One should not infer from �gure that all statements have iteration domains which lies in the same euclidean space. As a counter-example, consider the program of �gure . As shown in �gure , s has a onedimensional iteration domain, while s has a two-dimensional one. Finally, one should not confuse the iteration domain, which is spanned by lo op counters, and the data space, which is spanned by array indices. In many cases, those two spaces are identical (or rather, isomorphic) as in: 

for i := to n do for j := to n do x[i,j] := 0.; but this is not always true. In the case of the program in �gure , the iteration domain is two-dimensional while the data space is onedimensional. Conversely, in: 

**==> picture [185 x 10] intentionally omitted <==**

the data space is a one-dimensional subspace emb edded in a twodimensional space. 

**==> picture [7 x 9] intentionally omitted <==**

for i:= to n begin for j := to i- do S; for j := i+ to n do S; end; 

Figure : A sample program 

**==> picture [306 x 330] intentionally omitted <==**

**----- Start of picture text -----**<br>
j<br>r r r r r r r r �r<br>�<br>�<br>r r r r r r r �r �r<br>�<br>�<br>�<br>�<br>r r r r r r r �r r<br>�<br>�<br>s � �<br>�<br>r r r r r r �r r r<br>�<br>�<br>�<br>�<br>r r r r r � r r r r<br>�<br>�<br>�<br>�<br>�<br>r r r r� � r r r r r<br>�<br>�<br>�<br>�<br>r r r� � r r r r r r<br>�<br>� s<br>�<br>r �r �r r r r r r r<br>�<br>�<br>�<br>�<br>r �r r r r r r r r<br>�<br>�<br>�<br>�r r r r r r r r r<br>i<br>-<br>Figure : The iteration domain of program<br>**----- End of picture text -----**<br>


**==> picture [7 x 10] intentionally omitted <==**

for i := to n do begin x[i]:=0.; {S} for j := to i do x[i] := x[i] + u[i,j] * y[j] {S} end; 

Figure : An imp erfectly nested program 

**==> picture [231 x 341] intentionally omitted <==**

**----- Start of picture text -----**<br>
j<br>�r<br>�<br>�<br>�<br>�r r<br>�<br>�<br>��r r r<br>� s<br>�<br>r r r r<br>�<br>�<br>�<br>��r r r r r<br>�<br>�<br>r r r r r r -<br>�<br>i<br>r r r r r r -<br>s i<br>Figure : The iteration domain of program<br>**----- End of picture text -----**<br>


**==> picture [7 x 9] intentionally omitted <==**

for k := 0 to *n do c[k] := 0.; {S} for i := 0 to n do for j := 0 to n do c[i+j] := c[i+j] + a[i]*b[j]; {S} 

Figure : The pro duct of two p olynomials 

The preceding discussion leads to a spatial description of lo ops. Such a p oint of view go es back to the work of Kuck; see also Padua and Wolfe's review article [0]. Usually, lo ops are explained from a temp oral p oint of view: iteration i is executed just b efore iteration i + . We must seek a way to reconcile those two asp ects. This may b e done by de�ning a sequencing predicate on the iteration domains. The sequencing predicate is a strict total order on the set of op eration co ordinates; it is written: 

**==> picture [73 x 13] intentionally omitted <==**

and expresses the fact that (r; a) is executed b efore (s; b). The sequencing predicate dep ends only on the source program text. Our present aim is to give a simple expression for it. Supp ose �rst that r and s are statements in the outermost statement list of the program. a and b necessarily are the zero dimensional vector []. (r; []) � (s; []) i� r precedes s in the program text. Let Tr s b e a b o olean which is true i� r textually precedes s; in this case: 

(r; []) � (s; []) � Tr s : Note that Tr r is false and that if r = s then Tr s � : Tsr . Next, supp ose that r and s are the same statement. In this case, according to the familiar semantics of for lo ops, (r; a) � (r; b) i� a is lexicographically smaller than b. In the general case, there is an innermost lo op t whose b o dy contains b oth r and s. Let Nr s b e the depth of this lo op. In the b o dy of t, there are two statements r 0 and s0 such that r is r 0 or is textually inside r 0 , and s is s0 0 or is inside s . Obviously: 0 0 (r; a) � (s; b) � (r ; a[::Nr s ]) � (s ; b[::Nr s ]) 

0 0 Now, if a[::Nr s ] = b[::Nr s ], (r ; a) and (s ; b) b elong to distinct iterations of lo op t. In this case, their order is given by a lexical comparison of a[::Nr s ] 0 0 and b[::Nr s ]. Otherwise, if a[::Nr s ] = b[::Nr s ], then (r ; a) and (s ; b) b elong to the same iteration of t, and their order is the textual order Tr 0 s0 = Tr s . Putting all this together: (r; a) � (s; b) � a[::Nr s ] � b[::Nr s ] _ (a[::Nr s ] = b[::Nr s ] ^ Tr s ): () Knowledge of Nr s (a matrix of integers) and Tr s (a matrix of b o oleans) is all that is needed to sequence all op erations in a program. When lexicographic order is replaced by its de�nition, the sequencing predicate b ecomes a disjunction of Nr s + a�ne predicates which will b e written as �p : 

(r; a) �p (s; b) � (a[::p] = b[::p] ^ a[p + ] < b[p + ]); 0 � p < Nr s : () The version for p = Nr s is : (r; a) �p (s; b) � a[::Nr s ] = b[::Nr s ] ^ Tr s : () One may notice that op erations which stand in the relation �p to each other have exactly p identical co ordinates in their iteration vectors. In Allen and Kennedy's pap er[ ], if two such op erations give rise to a dep endence, one says that this dep endence is at depth p + , while if p = Nr s , the depth is said to b e in�nite. With a slight displacement of the origin, we will say that �p is the sequencing predicate at depth p, depths ranging from 0 to Nr s . Consider again the program of �gure . The sequencing b etween s and s is given by Ns s = and Ts s = true. Hence: 0 0 0 0 (s ; i) � (s ; i ; j ) � i < i _ i = i : () Similarly, the sequencing b etween two instances of s is given by: 0 0 0 0 0 (s ; i; j ) � (s ; i ; j ) � i < i _ (i = i ^ j < j ); () since Ts s is false. These results may b e summarized by �gure . In this diagram, we have only represented essential edges of the � relation. All other edges may b e recovered by using the transitivity of �. 

**==> picture [13 x 9] intentionally omitted <==**

**----- Start of picture text -----**<br>
0<br>**----- End of picture text -----**<br>


**==> picture [218 x 282] intentionally omitted <==**

**----- Start of picture text -----**<br>
j<br>�r<br>�<br>�<br>�<br>�r r<br>�<br>� L<br>�r r L r<br>� @@ LL<br>�<br>�<br>r s r r r<br>�<br>�<br>� C<br>�r r C r r r<br>� C<br>� B C<br>�r r B r C r r r -<br>� B C<br>A B C i<br>A B C B<br>A B C B<br>A B C BNB<br>AUA NB WC SwS<br>r r r r r r -<br>s i<br>**----- End of picture text -----**<br>


Figure : The sequencing predicate of lo op 

**==> picture [13 x 9] intentionally omitted <==**

Data Flow Analysis 

. Some Notation 

Supp ose that we are given a program conforming to the restrictions of section .. Let t b e a statement in which an array M is used. Let b b e the iteration vector of t; the indices of M are a�ne functions of b. In vector form, the reference to M may b e written M[g (b)]. 

Consider for instance the reference to v[i,k] in: 

for i := to n do for j := to i- do for k := i+ to n do v[j,k] := v[j,k]-v[i,k]*v[j,i]/v[i,i]; 

The surrounding lo op counters are i; j and k . The indexing function, g , is given by: 

**==> picture [331 x 78] intentionally omitted <==**

We are interested in �nding the source of the value of M[g (b)]. Let s ; s ; : : : ; sn b e the statements which pro duce a value for M, and let a ; a ; : : : ; an b e their iteration vectors. si is of the form: 

**==> picture [85 x 13] intentionally omitted <==**

The source is a co ordinate, or rather a function of b which gives a co ordinate when evaluated, which will b e called the source function of M[g (b)]. 

**==> picture [13 x 9] intentionally omitted <==**

. Formal Solution If the source of M[g (b)] is an instance of si , there is a unique ai such that this instance is (si ; ai ). This ai is a function of b, which will b e called Ksi t . The real source is the latest op eration (si ; Ksi t (b)): 

**==> picture [178 x 14] intentionally omitted <==**

The correct value of i may dep end on b. In particular, Ksi t (b) may b e unde�ned for some values of b. We will p ostulate that an unde�ned op eration (written as ?) comes earlier than any other op eration: 

**==> picture [89 x 13] intentionally omitted <==**

The conditions on Ksi t (b) are: 

**==> picture [296 x 13] intentionally omitted <==**

**==> picture [246 x 106] intentionally omitted <==**

**==> picture [389 x 166] intentionally omitted <==**

**==> picture [13 x 9] intentionally omitted <==**

Qsi t (b) = fujfi (u) = g (b); (si ; u) � (t; b); esi (u) � 0g ( ) with the convention that the lexical maximum of the empty set is ?. Now, since � is a disjunction of Nsi t + linear predicates, Qsi t is the union of Nsi t + disjoint p olyhedra, indexed by p; 0 � p � Nsi t : Qpsi t (b) = fujfi (u) = g (b); (si ; u) �p (t; b); esi (u) � 0g; (0) Kpsi t (b) = max� Qpsi t (b): () Finally, if max� is the maximum according to the sequencing predicate, then the source is given by: 

S = max� f(si ; Kpsi t (b))ji = ; : : : ; n; p = 0; : : : ; Nsi t g: () To avoid multiple indices, we will renumb er all p ossible candidates at all depths with a new index j . L will stand for the cardinality of the set of p ossible sources. () will b e rewritten as : 

**==> picture [278 x 13] intentionally omitted <==**

Let us go back to the example in Figure . Consider the problem of �nding the source of c[i+j] in statement s . There are two candidates, s and s itself, and as a consequence, two functions Ks s and Ks s . Consider for instance the set Qs s (i; j ). Its elements are two dimensional integer vectors (i0 ; j 0) which satisfy the following constraints: 

0 0 � the index equations, i + j = i + j ; 0 0 0 � the sequencing constraint i < i _ (i = i ^ j < j ). One sees that the second term in the disjunction is incompatible with the index equation. 0 0 � the limit constraints 0 � i � n; 0 � j � n. Examination of �gure shows that Qs s (i; j ) is empty if i = 0 or j = n. If not empty, its lexical maximum is the vector (i � ; j + ). This implies that to represent Ks s , we will need a conditional: 

**==> picture [13 x 9] intentionally omitted <==**

**==> picture [360 x 453] intentionally omitted <==**

**----- Start of picture text -----**<br>
k<br>r<br>r<br>Qs s (; ) r<br>I@@<br>r<br>@<br>@<br>s @<br>r j @<br>@<br>r r r @r r r<br>Qs s (; ) n<br>@<br>Qs s (; ) @<br>r �@�@@r r r @ r r<br>@@@@@@@@ s @@@<br>r r @@ @r r r @r<br>@�@� @<br>@<br>@<br>0 r r r @nr r r<br>@<br>@<br>0 r r r @@r r i -<br>Figure : Computing the source function for the program of Figure<br>The problem is �nding the source of c[] at iteration (; ) and of c[] at<br>iteration (; ) (circled p oints).<br>Square b oxes enclose the corresp onding Q sets.<br>**----- End of picture text -----**<br>


**==> picture [13 x 9] intentionally omitted <==**

Ks s (i; j ) = if (i � ^ j < n) then (i + ; j � ) else ?: () case of the other candidate is simpler; we always have: 

The case 

**==> picture [98 x 12] intentionally omitted <==**

Now, it should b e clear from an examination of program in �gure (or from the fact that Ns s = 0 and that Ts s is true), that all op erations 0 0 0 (s ; k ) precede all op erations (s ; i ; j ). It follows that the source is given by Ks s (i; j ) provided this quantity is de�ned. Hence, the �nal result is: S(i; j ) = if (i � ^ j < n) then (s ; i + ; j � ) else (s ; i + j ): () To obtain this result, we have relied a lot on �gure and geometrical intuition. Now this works �ne on oneand two-dimensional problems, but is quite di�cult and error prone in three dimensions, and is imp ossible b eyond. Furthermore, a computer has no geometrical intuition at all. Our aim now will b e to solve the ab ove problem in a general, systematic fashion and to implement the corresp onding algorithm. 

## . Evaluation Techniques 

## .. Direct Dep endences 

In this section, we will fo cus �rst on one particular candidate (sj ; Kj (b)) at a given depth p. When the original program conforms to the restrictions of section ., all terms in formula (0) are linear equalities or inequalities. In fact since indexing functions are a�ne, the �rst term is a linear system whose dimension is the rank of array M. The last term is simply a set of linear inequalities. The second term is given by () or (). If the depth p is less than Nsi t , then it is the conjunction of p equalities and one inequality. For p = Nsi t , it is made of equalities only and do es not exist if Tsi t is false. As a consequence, Qj (b) is the set of integer vectors which lie inside a p olyhedron. Finding its lexical maximum is a Parametric Integer Program 

**==> picture [13 x 9] intentionally omitted <==**

(a PIP)[]. A short description of an algorithm for solving PIP problems is given in the app endix. The parameters are the comp onents of b and the structure parameters. Note that the comp onents of b are not arbitrary; they must satisfy various constraints, among which is: 

**==> picture [52 x 13] intentionally omitted <==**

to which may b e added any available information on the structure parameters. These inequalities form the context of the parametric integer problem. To express the solution, we need the concept of a quasi-a�ne form. Such a form is constructed from the parameters and integer constants by the operations of addition, multiplication by an integer, and division by an integer. The solution is then expressed as a multistage conditional expression. The predicates are of the form f (b) � 0, where f is quasi-a�ne. The leaves are vector of quasi-a�ne forms or the \unde�ned" sign, ?. Such an expression will b e called a quasi-a�ne selection tree (quast for brevity). The ab ove de�nition may b e summarized by the following grammar: 

**==> picture [235 x 128] intentionally omitted <==**

The result of this analysis is the direct dep endence b etween the de�nition by sj and the use in t. Direct dep endences were �rst de�ned by Brandes [0 ]. The presence of a ? sign in a direct dep endence indicates that, for some values of the lo op counters, the reference in t is not de�ned by statement sj . 

Formula () is a quast in the ab ove sense (notice that integer division is not used here). Integer division app ears when analyzing programs which access arrays with strides greater than one, as in: 

s := 0.; 

**==> picture [13 x 9] intentionally omitted <==**

for i := to n do x[*i-] := .; {S} for k := to *n- do s := s + x[k]; {S} 

The direct dep endence from x[*i-] in s to x[k] in s is given by the following quast: 

**==> picture [287 x 12] intentionally omitted <==**

This formula expresses the fact that x[k] is not de�ned when k is even. 

.. Combining the direct dep endences 

Consider now the problem of evaluating (). This will b e done in a sequential manner, by intro ducing: 

**==> picture [207 x 29] intentionally omitted <==**

Obviously, S = SL and we have the recurrence: 

**==> picture [389 x 33] intentionally omitted <==**

S = max� fT; (sn ; Kn (b))g; () where T is an arbitrary quast. There are three cases, according to the form of T: 

**==> picture [372 x 108] intentionally omitted <==**

**==> picture [13 x 9] intentionally omitted <==**

� T = (r; l(b)) where r is a statement name and l is a quasi-a�ne form; then: S = if (r; l(b)) � (sn ; Kn (b)) then (sn ; Kn (b)) else (r; l(b)): (0) In this formula, the sequencing predicate is to b e expanded with the help of (). 

These rules (and their symmetric counterparts, as the max op erator is commutative), are the basic to ols for computing source functions. The result may b e simpli�ed by removing dead leaves (i.e. leaves which are governed by incompatible predicates) and by applying the rule: 

**==> picture [254 x 13] intentionally omitted <==**

**==> picture [331 x 50] intentionally omitted <==**

**==> picture [19 x 9] intentionally omitted <==**

**----- Start of picture text -----**<br>
and<br>**----- End of picture text -----**<br>


**==> picture [120 x 12] intentionally omitted <==**

One �rst applies ( ) to get: 

**==> picture [230 x 45] intentionally omitted <==**

The �rst branch of the conditional is computed with the help of (0) and the fact that (s ; i + j ) � (s ; i + ; j � ). The second branch is an instance of (). The result () follows. A more comprehensive example will b e presented later. 

**==> picture [13 x 9] intentionally omitted <==**

.. Avoiding unnecessary work While the ab ove algorithm always gives a complete and correct solution, in many cases, it is p ossible to reduce the amount of work by predicting the value of the sequencing predicate. Supp ose we have found two well de�ned direct dep endences (sm ; Km (b)) and (sn ; Kn (b)), resp ectively at depth pm and pn , for the same reference in op eration (t; b). Supp ose that the depths are di�erent, and for instance that pm < pn . From the de�nitions () and (0) it follows that: Km (b)[::pm ] = b[::pm ]; () Km (b)[pm + ] < b[pm + ]; () Kn (b)[::pn ] = b[::pm ]; 

and hence: 

**==> picture [298 x 13] intentionally omitted <==**

Now, all structured languages have the following prop erty: given two lo ops, either they have disjoint b o dies, or one of them includes the other. In our case, there are lo ops at depth pm which include sm and t, and sn and t. The b o dies of these lo ops cannot b e disjoint, and, since they have the same depth, they are identical. This is tantamount to saying that: 

**==> picture [225 x 13] intentionally omitted <==**

Consider now the sequencing predicate: 

(sm ; Km (b)) � (sn ; Kn (b)) � Km (b)[::Nsm sn ] � Kn (b)[::Nsm sn ] _ (Km (b)[::Nsm sn ] = Kn (b)[::Nsm sn ] ^ Tsm sn ): When evaluating this formula, there are two cases. Firstly, () may b e strict. From () we deduce that the �rst disjunct is true. If () in fact is an equality, then the �rst disjunct is false and the value of the sequencing predicate simply is Tsm sn . In b oth cases, we may compute the sequencing predicate without any reference to the actual values of the direct dep endences. This result may b e used in at least three ways: 

Rememb er that � is the strict lexical order. 

**==> picture [13 x 9] intentionally omitted <==**

**----- Start of picture text -----**<br>
0<br>**----- End of picture text -----**<br>


- When computing the direct dep endence, use of () allows one to reduce the numb er of unknowns in the parametric integer problem . 

- When evaluating (0), there is no need to expand the sequencing predicate unless b oth dep endences are at the same depth. 

- Most imp ortantly, b efore embarking on the evaluation of (), one may check whether (sn ; Kn (b)) o ccurs earlier than all leaves of Sn� or not. In the �rst case, the evaluation of Kn (b) is useless. One easily sees that this situation is most likely to o ccur if the candidate list is ordered by decreasing depth. 

. Summary Let us summarize the algorithm. For a given reference to an array or scalar M in a statement s, construct the candidate list from all pairs hr; pi where r is a statement which mo di�es M and p, 0 � p � Nr s ; is the dep endence depth. Set S = ?. Order the candidate list by decreasing depth. For each candidate, test if there is a p ossibility that it will contribute to the �nal source function. If not, discard the candidate. Otherwise, compute the direct dep endence by applying the PIP algorithm to (0). Use (), ( ) and (0) to up date the value of the source function and simplify. The algorithm may app ear to b e highly complex; there are, however, techniques to reduce the amount of work involved. Most of the time, the algorithm will b e emb edded in a restructuring compiler[0], which will start by computing the dep endence graph of the program. In fact, there is a �ow dep endence b etween statements r and s at depth p if the set Qpr s (b) is not empty for some legal value of b. Conversely, if there is no dep endence, Qpr s (b) is empty, Kpr s (b) = ?; 

and the value of S, as computed by (), do es not change. Hence the only candidates to b e considered are those which corresp ond to �ow dep endence Note that in the favourable case when there are no unknowns left, one still has to use the PIP algorithm to check that the obvious solution meets the inequalities constraints of (0). 

**==> picture [13 x 9] intentionally omitted <==**

edges. There are fast approximate metho ds for the calculation of dep endences [ ], and more precise metho ds[] which are still faster than a PIP computation. Scalar references are analysed in the same fashion as array references, the only di�erence b eing that the index equations fi (u) = g (b) in ( ) now disapp ear. At �rst glance, this may b e thought of as an imp ortant simpli�cation. We have found, in fact, that directly expressing the solution without the help of the PIP algorithm is highly complicated: for instance, one cannot simply say that the latest execution of a lo op is the one that corresp ond to the lo op upp er limit, since the lo op may not b e executed at all. As a consequence, we use the general algorithm whatever the rank of the reference. 

**==> picture [139 x 17] intentionally omitted <==**

**----- Start of picture text -----**<br>
Applications<br>**----- End of picture text -----**<br>


## . Conversion to t Form Single Assignmen 

Single assignment programs have b een prop osed by several authors[ , ] as a mean of sp ecifying algorithms for highly parallel systems. Another p oint[, ] is that since a memory cell in such a program is de�ned only once, its contents may b e considered as a \variable" in the mathematical sense and sub jected to the familiar algebraic and analytic manipulations. The following algorithm may b e used to convert a static control program to single assignment form: 

Compute the source function for all rhs references; 

- For each statement s , declare a new array Ms and replace the left hand side of s by Ms [a], where a is the iteration vector of s; 

- Replace all rhs references by the corresp onding source function with the following mo di�cations : 

   - { replace a leaf of the form (s; l(b)) by Ms [l(b)], { replace a void leaf ? by the original rhs reference. 

To justify the last prescription, note that a void source indicates that the corresp onding memory cell has not b een de�ned anywhere in the program. As a consequence, its value still is the one it had at the program start. 

**==> picture [13 x 9] intentionally omitted <==**

for i := to n do begin for j := to i- do for k := i+ to n do u[j,k] = u[j,k]-a[i,k]*u[j,i]/u[i,i]; {S} for j := i+ to n do for k := i+ to n do u[j,k] = u[j,k]-u[i,k]*u[j,i]/u[i,i]; {S} end Figure : A version of the Gauss-Jordan algorithm 

The result of this transformation may b e presented as a set of recurrence equations, with all a priori sequencing left out. 

Consider for instance the version in �gure of the Gauss-Jordan elimination algorithm (declarations and input/output statements omitted). Let us �rst detail the computation of the source of a[j,k] in s . s and s b oth are p ossible sources. Hence, there will b e two direct dep endences. A standard dep endence analysis will show that all dep endences are at depth 0. As a consequence, there are only two candidates, which are given by the PIP algorithm: 

**==> picture [275 x 29] intentionally omitted <==**

The problem is now to evaluate recurrence (). Obviously: 

**==> picture [215 x 12] intentionally omitted <==**

The �rst step in computing S is to apply rules ( ), () and (0) to obtain the interim result: 

**==> picture [13 x 9] intentionally omitted <==**

**==> picture [305 x 148] intentionally omitted <==**

**----- Start of picture text -----**<br>
S = if i � j �<br>then if j �<br>then if (s ; i � ; j; k ) � (s ; j � ; j; k )<br>then (s ; j � ; j; k )<br>else (s ; i � ; j; k )<br>else (s ; i � ; j; k )<br>else if j �<br>then (s ; j � ; j; k )<br>else ?<br>Examination of the original program gives:<br>**----- End of picture text -----**<br>


(s ; i � ; j; k ) � (s ; j � ; i; k ) � i � � j � which is false when i � j � : this is a case of elimination of a dead leaf. Next comes an application of (), and the �nal result is: 

S = if i � j � then (s ; i � ; j; k ) else if j � then (s ; j � ; j; k ) else ? Similar calculations for all other rhs references gives the LAU form of �gure . This result is quite involved, and may b e simpli�ed in several ways. However, we do not advo cate that such a co de b e used for actual computing, but rather as a starting p oint for further analysis and optimization. Hence, simpli�cation p er se may not b e worth the e�ort. 

## . Array and Scalar 

## Expansion 

Parallel or vector execution of a program may b e frustrated by allo cation of the same memory cell to unrelated values. This is called an output dep endence[0]. Transforming the program to single assignment style removes all such dep endences, at the cost of a large increase in memory usage. 

**==> picture [13 x 9] intentionally omitted <==**

� i � n; � j � i � ; i + � k � n : 

u[i,j,k] = if (i-j- >= 0) then u[i-,j,k] else if (j- >= 0) then u[j-,j,k] else u[j,k] - u[i-,i,k] / u[i-,i,i] * if (i-j- >= 0) then u[i-,j,i] else if (j- >= 0) then u[j-,j,i] else u[j,i] 

� i � n; i + � j � n; i + � k � n : u[i,j,k] = (if i- >= 0 then u[i-,j,k] else a[j,k]) - (if i- >= 0 then u[i-,i,k] else a[i,k]) * (if i- >= 0 then u[i-,j,i] else a[j,i]) / (if i- >= 0 then u[i-,i,i] else a[i,i]) 

Figure : The single assignment form of program 

**==> picture [13 x 9] intentionally omitted <==**

In many cases, such expansion is useless and should not b e done. For instance, on most vector computers, innermost lo ops are the only ones which are susceptible of vector mo de execution. In other cases, the output dep endence is accompanied by a true dep endence, which cannot b e eliminated by expansion. The problem of deciding which lhs should b e expanded and/or renamed is highly dep endent on the target computer and will not b e addressed here. We will supp ose that we are given a list of mo di�ed lhs, the new lhs for op eration (s; a) b eing Ms [f (a)]. Most often, f will b e a selection op erator on the comp onents of a. One then applies the algorithm of Section ., with step mo di�ed in the following fashion : 

- ' Replace all rhs references by the corresp onding source function with the following mo di�cations : 

   - { replace a leaf of the form (s; l(b)) by Ms [f (l(b))] if the lhs of s has b een mo di�ed, and by the original rhs if s is untouched. 

   - { replace a void leaf ? by the original rhs reference. 

Obviously, a rhs all of whose sources are untouched is not mo di�ed by the ab ove prescription. Note that not all renaming and expansion are legitimate. When one needs a value, one must take care that it has not b een overwritten some time b efore. There is a precise solution to this problem. To check that a value pro duced by (s; K(b)) with lhs Ms (f (a)) is still available at (t; b), one should test that for all statements r with lhs Ms [h(c)] the following problem : 

**==> picture [148 x 47] intentionally omitted <==**

has no solution in c in the context et (b) � 0. There are many cases in which this calculation is not necessary. Let us note the case in which Ms is used only in s, and the one in which all uses of Ms have as indices a sup erset of the indices of the original lhs. 

## . Program Checking and Optimization 

Here we will supp ose that we are given a program complete with initializations and input/output statements. These statements are easily included in 

**==> picture [13 x 9] intentionally omitted <==**

the present framework. For instance, an output statement may b e mo delled as a statement with rhs references but no lhs. The �rst step in the veri�cation of such a program is to check the sources for the presence of the ? sign, which indicates access to an unde�ned memory cell. When computing a source, one may re�ne the p olyhedron Q(b) by adding linear constraints expressing the fact that all indices are within the array b ounds. The ? sign will in that case pin-p oint an out-of-b ound access. Most often, the ? sign will app ear inside a conditional whose predicate gives a condition on the structure parameters which must b e checked for the program to run correctly. Adding a run-time test for this condition is a simple matter. Knowledge of the source functions allows very precise detection of dead co de. Certainly all output statements are useful co de and should b e marked accordingly. If statement t is marked, all statements which o ccur in sources for rhs references in t are useful. When this pro cess (which is nothing more than a graph traversal algorithm) terminates, unmarked statements are dead co de. Finally, the single assignment form of a program is an invaluable help in checking that the program has the desired b ehaviour. Consider for instance two very similar pieces of co de: for i:= to n do a[i] := a[i+] {} for i:= to n do a[i] := a[i-] {} Their single assignment transcriptions are widely di�erent: for i:= to n do A[i] := a[i+] {} for i:= to n do A[i] := if i- >= 0 {} then A[i-] else a[i-] where A is a new array. In the case of f g, the assignment : A[i] := A[i-] may b e considered as a recurrence in the usual mathematical sense and solved to yield : = A[i] a[0] 

**==> picture [13 x 9] intentionally omitted <==**

## Construction 

. Parallel Program Construction An obvious idea is to summarize the source function by a graph. There is an edge from s to t for each o ccurence of s in a source of a rhs reference in t. This gives the data�ow graph of the original program. It is obtained from the usual dep endence graph[0 ] by removing output dep endences, antidep endences and spurious �ow dep endences. This graph may b e submitted to classical parallelization and vectorization algorithms[]. One still has to expand some variables to reconstruct a correct program. Another approach is to consider the source functions as synchronization constraints (a statement which uses a given value may not start executing until the source statement has terminated), and to attempt the construction of a parallel program which meets all of them. This approach is reminescent of the metho dology for the automatic or semi-automatic design of systolic arrays [], and leads to the consideration of timing functions or schedules. The use of timing functions for the construction of parallel program has b een advo cated in several pap ers[ , ,  ]. The outcome of this research will b e rep orted elsewhere. 

**==> picture [98 x 13] intentionally omitted <==**

**----- Start of picture text -----**<br>
Related<br>**----- End of picture text -----**<br>


## Work 

This pap er is related to work in two di�erent areas: one is standard data�ow analysis[], which is used as a basic technique by many optimizing compilers, and the other is the sp eci�cation and compilation of data�ow languages. Standard data�ow analysis is b oth more and less comprehensive than the present one. Its range of applicability is wider, since it deals with unstructured programs. However, it is a static theory (all executions of a statement in a lo op are lump ed as one), and, as such, applies only to scalars (or to arrays considered as a whole). An example is the determination of use-def chains. To each use (rhs o ccurence) of a variable x is asso ciated a list of de�nitions of x which may b e the source of the current value of x. Use-def chains are computed by iteratively solving propagation equations. In our framework, use-def chains could b e obtained by computing the frontier of the source functions and removing all informations ab out iteration vectors. In a similar context, a technique for conversion to static single assignment form has b een advo cated by Cytron et. al. []. Here again, the source 

**==> picture [13 x 9] intentionally omitted <==**

program is not required to b e structured, and only scalars or arrays taken as a whole are considered. The pap er is concerned with the most economical insertion of so-called �-functions (i.e. multiplexors) at join p oints in the control graph. When this is done, it is p ossible to rename all variables and to obtain a single assignment program. Data�ow architectures are one of several ways of exploiting single assignment programs. Each architecture has a machine language, which in general is presented as a data�ow graph. One of the problems in this �eld is how to provide a more user-friendly interface, either in the form of a high-level parallel language, or by translating conventional language to data�ow. Our work is certainly relevant to this aim. A recent pap er[ ] gives an algorithm for translating FORTRAN to data�ow graphs. Here again the problem is with arrays. A data�ow machine has no di�culty in executing the �owgraph equivalents of doall or doacross lo ops. Detecting such lo ops, however, must use classical techniques like dep endence analysis. Dep endence analysis is mainly used by parallelizing and vectorizing compilers. There is a �ow or true dep endence b etween two statements if the �rst one is a p ossible source for a value which is used by the other[0, ]. There are other kinds of dep endences: antiand output-dep endences, which indicate memory sharing, and control dep endences, which summarize the control �ow in the source program. 

One may say that a �ow dep endence is a very imprecise approximation to the source function. Some more precise descriptions are the dep endence direction vectors[], the dep endence vectors[], the dep endence cone[] and the direct dep endences[0]. Scalar expansion[0] is the particular case of the present problem in which the mo di�ed variable is a scalar which is expanded to a vector. If one restricts oneself to innermost lo ops, the problem has a very simple solution. 

**==> picture [126 x 13] intentionally omitted <==**

**----- Start of picture text -----**<br>
Conclusion<br>**----- End of picture text -----**<br>


The main result of this pap er is the description of an algorithm for the data�ow analysis of programs with array references and for lo ops. It has b een implemented partly in Lisp and partly in C, and runs on several computers ranging from a p ersonal computer to a DEC Vax /0. No e�ort has b een made (at the time of writing) to optimize the co de (the Lisp to C interface 

**==> picture [13 x 9] intentionally omitted <==**

**==> picture [256 x 153] intentionally omitted <==**

**----- Start of picture text -----**<br>
lines lhs rhs level leaves CPU<br>across 0 0.<br>burg 0 0 .<br>relax 0 .<br>gosser 0 .<br>choles .<br>lanczos .<br>jacobi 0 0 .<br>Table : Some kernels and their data�ow analysis<br>**----- End of picture text -----**<br>


is esp ecially clumsy). Table gives some quantitative results for a set of small to medium kernels. For each program we give the line count, the numb er of assignment statements (lhs), the numb er of rhs references and the maximum nesting level. The results are the numb er of leaves in the source quasts (which caracterizes the complexity of the solution), and the CPU time in seconds on a low-end SPARC station. One may observe that the source functions are quite simple: ab out two leaves p er rhs reference. As to the CPU time, the main controlling factor seems to b e the maximum nesting level in the program. The time p er leaf go es from ms for a one level program to  0 ms for a four level program. While these values may b e somewhat reduced by converting the Lisp part of the program to C, we do not exp ect more than one order of magnitude improvement. It seems clear that the metho d will b e applied only to small kernels or to larger programs whose running time is highly critical (e.g., library mo dules). We have describ ed several applications of our technique; the reader will probably b e able to add several new items to the list. Most of these are esp e- cially interesting in the context of automatic parallel program construction and will b e develop ed with this kind of application in mind. Some of these metho ds will require further study to b ecome op erational; these unsolved p oints have b een noted where appropriate. Extending the technique to languages with fewer restrictions than we intro duced in section . would b e highly interesting. Some estimate of the applicability of our technique may b e deduced from the statistics of Zhiyu 

**==> picture [13 x 9] intentionally omitted <==**

**----- Start of picture text -----**<br>
0<br>**----- End of picture text -----**<br>


Shen et. al.[]. The main di�culty is non-linear indices. In this pap er, which analyses more than 00 000 lines of co de, ab out % of all indices are found to b e linear, ab out % are partially linear, and the remaining % are non-linear. An index is classi�ed as partially linear as so on as it contains a variable which is not a lo op counter. Some of these unknown variables may b e eliminated by forward substitution. Some others are structure parameters. Hence we exp ect that the only signi�cant failure cause will b e the use of an array element as an index, which account for ab out % of all cases. Before b eing submitted to a data�ow analysis, a program must b e put in structured form. There are technique for the elimination of goto's[] and for the detection of induction variables[], which then allows one, in favourable cases, to reconstruct unit increment for lo ops and to delete extraneous variables by forward substitution[, , ]. We exp ect that the handling of conditionals (by the familiar device of reducing them to guards on assignment statements) would not b e to o di�cult. Conditionals whose predicate dep ends only on lo op counters should b e handled as restriction on the iteration domains of the controlled statements. while lo ops may p erhaps b e handled, in the context of parallel program construction, as lo ops with an unb ounded iteration domain. On the other hand, linearity restrictions are crucial for the applicability of the metho d, and we do not envision at the present time any trick for disp ensing with them. Lastly, the analysis of programs with pro cedure and function calls is a very di�cult problem. If we restrict ourselves to the handling of small kernels, a few tricks should do the job: identify those function calls which act as op erators (no argument is mo di�ed, no global variable is accessed). Other subroutine calls should probably b e inlined. 

## Acknowledgments 

This work has b een supp orted by DRET under contract /0 and by PRC C of the french CNRS. Part of section . has b een repro duced[ ] by p ermission of ACM. 

**==> picture [13 x 9] intentionally omitted <==**

A The Parametric Integer Algorithm 

A. The Basic Algorithm 

A parametric integer program (PIP) may b e formulated in the following way. Let F(z) b e the set of integer p oints inside a convex p olyhedron: 

**==> picture [296 x 13] intentionally omitted <==**

where S and K are matrices and t(z) is an integer vector whose comp onents are a�ne functions of the integer vector z. z is constrained by the set of inequalities K z + h N; 

the context of the problem. As a matter of convenience, we will supp ose that b oth S and K are such that they restrict x and z to non-negative integer values. In particular, the �rst jxj rows of S will generate the constraint x N. The problem is to decide for which values of z is F(z) empty, and if not, to compute its lexical minimum, as a function of z. The solution is given by the following algorithm : Algorithm N 

Determine the signs of the comp onents of t(z) in the context 

**==> picture [66 x 12] intentionally omitted <==**

by solving non-parametric auxilliary integer programs. The sign may b e p ositive, negative or unknown. 

If there is a negative ti (z), then either: 

- . All elements of Si� are negative. In this case, F(z) is empty, and the solution is ?. 

- . There is at least a p ositive Sij ; a pivoting step is executed, giving 0 0 

- a new problem hS ; t (z)i. The solution of the initial problem is the same as that of the new problem in the old context. In that case, keep track of D , the pro duct of the pivots. 

**==> picture [13 x 9] intentionally omitted <==**

- If all ti (z) are p ositive, select the earliest row i such that one of Sij or the co e�cients in ti (z) is not integral. If no such row exists (in particular if D = ), the solution has b een found; it is given by the �rst jxj comp onents of t(z). If such a row exists, let q b e a new parameter. Add : 

**==> picture [203 x 13] intentionally omitted <==**

to the context. Let m b e the numb er of rows in S . Add to S the new row m + with the following co e�cients : 

**==> picture [294 x 51] intentionally omitted <==**

In the remaining case, select a ti (z) whose sign is unknown; let x+ and x� b e resp ectively the solutions of hS; t(z)i in the contexts 

**==> picture [117 x 13] intentionally omitted <==**

**==> picture [20 x 9] intentionally omitted <==**

**----- Start of picture text -----**<br>
and<br>**----- End of picture text -----**<br>


**==> picture [265 x 33] intentionally omitted <==**

**==> picture [151 x 13] intentionally omitted <==**

This algorithm is guaranteed to terminate (see [ ]). The result is a multilevel conditional expression whose predicates and leaves are a�ne functions of the parameters. The new parameters like q ab ove may b e replaced by their expressions as integer quotients of a�ne forms. The algorithm ab ove is not entirely deterministic; there are many equivalent solutions to the same problem. Exp erience has shown that a few simple heuristics su�ce for selecting a well b ehaved solution. First of all, avoid splitting (case ) at all cost (e.g. by grouping the case ti (z) = 0 with the p ositive or negative case if the other case do es not exist). If forced to split, select a row with all co e�cients negative, which implies that x� = ?. This algorithm has b een implemented b oth in Lisp and C; these co des have b een used to run all examples in this pap er. 

**==> picture [13 x 9] intentionally omitted <==**

## A. The lexical maximum 

In many cases of interest, one has to compute a lexical maximum rather than a minimum. Sometimes, a transformation from one problem to the other is in evidence. We favour, however, the following systematic pro cedure. Algorithm M Refering back to (), intro duce a new \very large" parameter m and solve: u = min� G(z; m)=K z + h N; 

**==> picture [326 x 27] intentionally omitted <==**

Compute v = m � u and prune the solution by replacing all tests in whose predicate m has a p ositive co e�cient by their true branch and conversely. A leaf in which m o ccurs with a p ositive co e�cient is asso ciated to a range of the parameters where F(z) is unb ounded. This case will never o ccur in the problems we are interested in. It is easy to prove that v is the required maximum; it is also easy to devise metho ds to do the pruning \on line", so as to keep the extra computation to a minimum. For instance, in step () of algorithm N, if m o ccurs with a p ositive sign in ti (z), the i-th line may b e taken as p ositive. We have found in practice that in cases where we need to compute b oth the maximum and the minimum of the same set, b oth algorithms have op eration counts of the same order of magnitude, and neither of them is systematically longer than the other. 

**==> picture [94 x 13] intentionally omitted <==**

**----- Start of picture text -----**<br>
References<br>**----- End of picture text -----**<br>


- [] A.V. Aho, R. Sethi, and J.D. Ullman. Compilers: Principles, Techniques and Tools. Addison-Wesley, Reading, Mass,  . 

- [] J.R. Allen and Ken Kennedy. Automatic lo op interchange. In Proc. of the ACM SIGPLAN Compiler Conference, pages {, June  . is the vector all of whose comp onents are . 

**==> picture [13 x 9] intentionally omitted <==**

- [] Randy Allen and Ken Kennedy. Automatic translation of FORTRAN programs to vector form. ACM TOPLAS, (): {, Octob er  . 

- [] Zahira Ammarguellat. Normalization of Program Control Flow. Technical Rep ort , CSRD, May   . 

- [] Zahira Ammarguellat. Restructuration des programmes FORTRAN en � � 

- vue de leur paral lelisation. PhD thesis, Universite P. et M. Curie, Paris, Decemb er  . 

- [] Jacques Arsac. La construction de programmes structur�es. Duno d, Paris,  . 

- [] E. A. Ashcroft and W. W. Wadge. Lucid, the Data-�ow Programming Language. Academic Press,  . 

- [] Brenda S. Baker. An algorithm for structuring programs. Journal of the ACM, : {0,  . 

- [ ] Micah Beck, Richard Johnson, and Keshav Pingali. From control �ow to data�ow. Journal of Paral lel and Distributed Computing, :{ ,   . 

- [0] Thomas Brandes. The imp ortance of direct dep endences for automatic parallelization. In ACM Int. Conf. on Supercomputing, St Malo, France, July  . 

- [] Ron Cytron, Jeanne Ferrante, Barry K. Rosen, Mark N. Wegman, and F. Kenneth Zadeck. An e�cient metho d of computing static single assignment form. In Proc. th ACM POPL Conf., pages {, January   . 

- [] Paul Feautrier. Array expansion. In ACM Int. Conf. on Supercomputing, St Malo,  . 

- [] Paul Feautrier. Asymptotically e�cent algorithms for parallel architectures. In M. Cosnard and C. Girault, editors, Decentralized Systems, pages {, IFIP WG 0., North-Holland, Decemb er   . 

- [] Paul Feautrier. Parametric integer programming. RAIRO Recherche � 

- Operationnel le, :{, Septemb er  . 

**==> picture [13 x 9] intentionally omitted <==**

- [] Fran�cois Irigoin and R�emi Triolet. Sup erno de partitioning. In Proc. th POPL, pages  {, San Diego, Cal., January  . 

- [] Pierre Jouvelot and Babak Dehb onei. A uni�ed semantic approach for the vectorization and parallelization of generalized reductions. In Procs. of the rd Int. Conf. on Supercomputing, pages { , ACM Press,   . 

- [] David J. Kuck. The Structure of Computers and Computations. J. Wiley and sons, New York,  . 

- [] Leslie Lamp ort. The parallel execution of DO lo ops. CACM, :{ , February  . 

- [ ] Lee-Chung Lu. A uni�ed framework for systematic lo op transformations. SIGPLAN Notices, :{, July   . rd ACM SIGPLAN Symp. on Priciples and Practice of Parallel Programming. 

- [0] D. A. Padua and Michael J. Wolfe. Advanced compiler optimization for sup ercomputers. CACM,  :{0 , Decemb er  . 

- [] William Pugh. Uniform techniques for lo op optimization. ACM Conf. on Supercomputing, {, January   . 

- [] Patrice Quinton. Mapping recurrences on parallel architectures. In rd Int. Conf. on Supercomputing, Boston, May  . 

- [] Zhiyu Shen, Zhiyuan Li, and Pen-Chung Yew. An empirical study on array subscripts and data dep endencies. In Int. Conf. on Paral lel Processing, pages I I {,   . 

- [] N. Suzuki and D. Je�erson. Veri�cation decidability of Pressburger array programs. In Procs. of a conf. on TCS, Waterlo o,  . 

- [] J.C. Syre, D. Comte, and N. Hifdi. Pip elining, parallelism and asynchronism in the LAU system. In Int. Conf. on Paral lel Processing,  . 

- [] Nadia Tawbi, Alain Dumay, and Paul Feautrier. PAF : un paral l�eliseur automatique pour FORTRAN. Technical Rep ort , MASI,  . 

**==> picture [13 x 9] intentionally omitted <==**

- [] L. G. Tesler and H. J. Enea. A language design for concurrent pro cesses. In SJCC, pages 0{0,  . 

- [] Michael J. Wolfe and Utpal Banerjee. Data dep endence and its application to parallel pro cessing. Int. J. of Paral lel Processing, :{,  . 

@ARTICLE{Feau: , AUTHOR = "Paul Feautrier", TITLE = "Dataflow Analysis of Scalar and Array References", JOURNAL = "Int. J. of Parallel Programming", VOLUME = 0, NUMBER = , YEAR = "  ", MONTH = Feb, PAGES = "--" 

**==> picture [7 x 11] intentionally omitted <==**

**----- Start of picture text -----**<br>
}<br>**----- End of picture text -----**<br>


**==> picture [13 x 9] intentionally omitted <==**

